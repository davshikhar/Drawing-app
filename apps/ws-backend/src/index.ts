import dotenv from "dotenv";
import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
dotenv.config({path:"../../.env"});
import { prisma } from "@repo/db/client";
// import { JWT_SECRET } from "@repo/backend-common/config";//we can also import jwt secret like this

const wss = new WebSocketServer({port:8080});

//this is not the most optimal approach, we are also storing socket object associated with each user.
interface User{
    ws:WebSocket,
    rooms:string[],
    userId:string
};

const users: User[]=[];

function checkUser(token:string):string|null{
    try{
        //putting inside a try catch to make sure that backend does not crash.
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if(typeof decoded == "string"){
        return null;
    }

    if(!decoded || !decoded.userId){
        return null;
    }

    //or we can do this also
    // if(!decoded || !(decoded as JwtPayload).userId){
    //     ws.close();
    //     return;
    // }

    return decoded.userId;
    }
    catch(e){
        return null;
    }
    return null;
}

wss.on("connection", function connection(ws, request){
    const url = request.url;//getting the url to extract the token from query params.
    if(!url){
        return;
    }
    const queryParams = new URLSearchParams(url.split("?")[1]);//splits the url at "?" and divies the url into array of 2 elements and takes out the [1] element.
    const token = queryParams.get("token") || "";//getting the token from query params.
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    const userId = checkUser(token);

    if(userId==null){
        ws.close();return;
    }

    users.push({
        userId,
        rooms:[],
        ws
    });

    
    //only if the user is authenticated do we let the control reach over here.
    ws.on("message", async function message(data){
        //since the data is usually in the form of string, we need to parse it to JSON.
        //since we receive data in form {type:"join_room",roomId:1}
        const parsedData = JSON.parse(data as unknown as string);
        if(parsedData.type === "join_room"){
            //if message is join_room find user in global array and push it into the rooms array.
            const user = users.find(x=>x.ws===ws);
            user?.rooms.push(parsedData.roomId);
        }

        if(parsedData.type === "leave_room"){
            //if message is leave_room find user in global array and remove their room
            const user = users.find(x=>x.ws===ws);
            if(!user){
                return;
            }
            //remove the specific room from the user
            user.rooms = user.rooms.filter(x=>x===parsedData.room);
        }
        if(parsedData.type === "chat"){
            //here we can put various checks for the messages.a
            const roomId = parsedData.roomId;
            const message = parsedData.message;

            //first storing the chat in the database.
            //implement the push to queue approach using redis and bullMQ
            await prisma.chat.create({
                data:{
                    roomId,
                    message,
                    userId
                }
            });
            //sending the message to the users who are interested/joined in that room except the user who sent that message.
            users.forEach(user => {
                if(user.rooms.includes(roomId) && user.ws!==ws ){
                    user.ws.send(JSON.stringify({
                        type:"chat",
                        message,
                        roomId
                    }));
                }
            })
        }
    });
})