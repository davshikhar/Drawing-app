import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import {z} from  "zod";
import { middleware } from "./middleware";
import {signupSchema, siginSchema, createRoomSchema} from "@repo/common/types";
import {prisma} from "@repo/db/client";
dotenv.config({path:"../../.env"});
import bcrypt from "bcrypt";

const app = express();
const port = 3001;

app.use(express.json());

// const schema = z.object({
//     name:z.string().max(20,"Name should be under 20 characters"),
//     email:z.email("Email is not valid"),
//     password:z.string().max(20, "Password should be under 20 characters")
// });
// const siginSchema = schema.pick({email:true,password:true});

//should change username to email in the schema and everywhere else 
app.post("/signup",async (req,res)=>{
    const safe = {username:req.body.username, password:req.body.password, name:req.body.name};
    const User = signupSchema.safeParse(safe);
    if(!User.success){
        return res.json({
            message:"Invalid data"
        });
    }
    const hashedPassword = await bcrypt.hash(User.data.password,3);
    try{
        //here change the username to email in the schema
        const user = await prisma.user.create({
        data:{
            email:User.data?.username,
            password:hashedPassword,
            name:User.data.name,
        }
    });
    res.json({
        userId:user.id,
        message:"User created successfully"
    });
    }
    catch(e){
        if(e instanceof Error && e.message.includes("duplicate key value violates unique constraint")){
            return res.status(400).json({message:"User already exists"});
        }
        else{return res.status(500).json({message:"Internal server error"});}
    }
})

app.post("/signin",async (req,res)=>{
    const login = {username:req.body.username, password:req.body.password};
    const loginData = siginSchema.safeParse(login);
    if(!loginData.success){
        return res.json({
            message:"Invalid data"
        });
    }
    else{
        const user = await prisma.user.findUnique({
            where:{
                email:loginData.data.username
            }
        });
        if(user==null){
            return res.status(400).json({message:"No such user found"});
        }
        const passwordMatch = await bcrypt.compare(loginData.data.password,user.password);
        if(passwordMatch){
            const token = jwt.sign(
                {userId:user.id},process.env.JWT_SECRET as string
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

app.post("/room",middleware,async (req,res)=>{
    //db call over here to create a room
    const parsedData = createRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"Invalid data",
        })
        return;
    }
    //@ts-ignore, fix these in globa request object
    const userId = req.userId;
    await prisma.room.create({
        data:{
            slug:parsedData.data.name,
            adminId:userId
        }
    });
    
    res.json({
        roomId:"12345",
        message:"Room created successfully"
    });
})

app.listen(port);