import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
require("dotenv").config({path:"../../.env"});
// import { JWT_SECRET } from "@repo/backend-common/config";//we can also import jwt secret like this

const wss = new WebSocketServer({port:8080});

wss.on("connection", function connection(ws, request){
    const url = request.url;//getting the url to extract the token from query params.
    if(!url){
        return;
    }
    const queryParams = new URLSearchParams(url.split("?")[1]);//splits the url at "?" and divies the url into array of 2 elements and takes out the [1] element.
    const token = queryParams.get("token") || "";//getting the token from query params.
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    //or instead of doing this we can check before this that if the decoded is a string or not and then end he connection there.
    if(!decoded || !(decoded as JwtPayload).userId){
        ws.close();
        return;
    }

    
    //only if the user is authenticated do we let the control reach over here.
    ws.on("message", function message(data){
        console.log("received: %s",data);
    });
    ws.send("Welcome pong!");
})