//request object can also contain userId.
declare global{
    namespace Express{
        interface Request{
            userId:string;
        }
    }
}

export {};