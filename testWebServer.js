//this is your global data
const students = [
    { name: 'Matt', course: 'Math', grade: 97 },
    { name: 'Scott', course: 'English', grade: 80 },
    { name: 'Arnold', course: 'Robotics', grade: 98 },
];
//remember to install express and body-parser
const express = require('express');
const bodyParser = require('body-parser');  //used to grab data from post bodies

const webserver = express();
webserver.use(bodyParser.urlencoded({ extended: false }));
webserver.use(bodyParser.json());

//SERVER.get('PATH', CALLBACKFUNCTION )

webserver.use( express.static( __dirname + '/html') );

webserver.get('/students', function(req, res){
    // console.log(req)
    //
    // console.log(res)

    console.log(req.query)
    if(req.query.command==='create'){
        res.send(bodyParser.json(students))
    }


    //get all students and return them here
    //get all students from the global student variable
    //convert to json
    //output that data in a way that your SGT will understand (look at what our SGT backend did)
});
//notice that this is a post request, not a get request
webserver.post('/students', function(req, res){
    //create a student here.
    //get data from the post data
    //	https://www.npmjs.com/package/body-parser
    //req.body.DATAYOUWANT
    //use that data from the post data to make new object
    //add the object to the array
});

//notice this is a delete request, not a get or post request
webserver.delete('/students', function(req, res){
    //delete a student here
    //get the ID from the post data
    //delete the item from the array
    //return true if you deleted it
    //remember your SGT was expecting data like from our server
});



webserver.listen(3000, function(){
    console.log('server is listening');
})



