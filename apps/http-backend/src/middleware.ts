import { NextFunction } from "express";
import {Request, Response} from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
export function middleware(req:Request,res:Response,next:NextFunction){
    const token= req.headers["authorization"] ?? "";

    const decode = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload &{userId:string};

    if(decode){
        //the modification of req object must be done to have userId in the req object it must be done globally in other file
        req.userId = decode.userId;
        next();
    }
    else{
        res.status(401).json({
            message:"Unauthorized"
        });
    }
}