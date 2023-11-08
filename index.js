const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true   
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g9xsrko.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const roomsCollection = client.db('innSight').collection('rooms');
        const bookingCollection = client.db('innSight').collection('bookings');

        
        //auth related
        app.post('/jwt', async(req, res)=>{
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
            res
            .cookie('token', token, {
                httpOnly: true,
                secure: false,
                   
            })
            .send({success: true})
        })

        // services related
        app.get('/rooms', async (req, res) => {
            const cursor = roomsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })



        app.get('/rooms/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {
                projection: { id: 1, roomType: 1, image: 1, price: 1, description: 1, pricePerNight: 1, roomSize: 1, availability: 1, images: 1, specialOffers: 1, reviews: 1 }
            }

            const result = await roomsCollection.findOne(query);
            res.send(result);
        })

        // bookings
        app.get('/bookings', async (req, res) => {
            console.log(req.query.email);
            console.log('token', req.cookies.token);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        app.patch('/bookings/:id', async (req, res) =>{
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updatedDoc ={
                $set:{
                    status: updatedBooking.status
                }
            };
            const result = await bookingCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.get('/availability/:serviceId', async (req, res) => {
            const serviceId = req.params.serviceId;
            const bookings = await bookingCollection.find({ service_id: serviceId }).toArray();
            const availabilityByDate = {};
        
            // Calculate availability for each date
            bookings.forEach((booking) => {
                const date = booking.date;
                availabilityByDate[date] = availabilityByDate[date] ? availabilityByDate[date] - 1 : availability - 1;
            });
        
            res.send(availabilityByDate);
        });

        
        

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('innsight server is running')
})

app.listen(port, () => {
    console.log(`innsight server is running on port ${port}`);
})