require('dotenv').config();
import express, {Request, Response} from 'express';
import { graphqlHTTP } from 'express-graphql';
import schema from './api/schema';
const app = express();
const port:number = 3001;

app.get('/', (req: Request, res : Response) => {
    res.send("API Server is running... " + `${req.ip}`);
});

app.use('/graphql', graphqlHTTP({
    graphiql:true,
    schema:schema
}));

app.listen(port, () => {
    console.log(`Server running on PORT ${port}`);
});