import express from "express";
import jwt from "jsonwebtoken";
import {z} from  "zod";
import { middleware } from "./middleware";

const app = express();
const port = 3001;

const schema = z.object({
    name:z.string().max(20,"Name should be under 20 characters"),
    email:z.email("Email is not valid"),
    password:z.string().max(20, "Password should be under 20 characters")
});

const siginSchema = schema.pick({email:true,password:true});

app.post("/signup",(req,res)=>{
    const safe = {name:req.body.name, email:req.body.email, password:req.body.password};
    const User = schema.safeParse(safe);
    if(!User.success){
        return res.json({
            message:"Invalid data"
        });
    }
    console.log(User.data);
    res.json({
        user:User.data,
        message:"User created successfully"
    });
})

app.post("/signin",(req,res)=>{
    const login = {email:req.body.email, password:req.body.password};
    const loginData = siginSchema.safeParse(login);
    if(!loginData.success){
        return res.json({
            message:"Invalid data"
        });
    }
    else{
        const passwordMatch = false;
        const response = {"name":"shikhar"};
        if(passwordMatch){
            const token = jwt.sign(
                {name:response.name},process.env.JWT_SECRET as string
            );
            res.json({token:token});
            return;
        }
        else{
            return res.status(403).json({
                message:"Invalid credentials"
            });
        }
    }
});

app.post("/room",middleware,(req,res)=>{
    //db call over here to create a room
})

app.listen(port);