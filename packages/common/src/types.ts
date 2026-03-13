import {z} from "zod";

export const signupSchema = z.object({
    username:z.string().min(3).max(20,"Username should be under 20 characters"),
    password:z.string().min(6,"Password should be at least 6 characters"),
    name:z.string()
});

export const siginSchema = signupSchema.pick({username:true,password:true});

export const createRoomSchema = z.object({
    name:z.string().min(3).max(20)
});