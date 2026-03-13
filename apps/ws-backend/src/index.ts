import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
require("dotenv").config({path:"../../.env"});

const wss = new WebSocketServer({port:8080});

wss.on("connection", function connection(ws, request){
    const url = request.url;
    if(!url){
        return;
    }
    const queryParams = new URLSearchParams(url.split("?")[1]);//splits the url at "?" and divies the url into array of 2 elements and takes out the [1] element.
    const token = queryParams.get("token") || "";
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    if(!decoded || !(decoded as JwtPayload).userId){
        ws.close();
        return;
    }

    
    //only if the user is authenticated do we let the control reach over here.
    ws.on("message", function message(data){
        console.log("received: %s",data);
    });
    ws.send("Welcome");
})