import { NextFunction } from "express";
import {Request, Response} from "express";
import jwt from "jsonwebtoken";
export function middleware(req:Request,res:Response,next:NextFunction){
    const token= req.headers["authorization"] ?? "";

    const decode = jwt.verify(token, process.env.JWT_SECRET as string);

    if(decode){
        //@ts-ignore TODO:- FIX THE ERROR
        req.userId = decode.userId;
        next();
    }
    else{
        res.status(401).json({
            message:"Unauthorized"
        });
    }
}