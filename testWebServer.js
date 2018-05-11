//this is your global data
const students = [
    { name: 'Matt', course: 'Math', grade: 97 },
    { name: 'Scott', course: 'English', grade: 80 },
    { name: 'Arnold', course: 'Robotics', grade: 98 },
];
var currentID = 0;
//remember to install express and body-parser
const express = require('express');
const bodyParser = require('body-parser');  //used to grab listData from post bodies

const webserver = express();
webserver.use(bodyParser.urlencoded({ extended: false }));
webserver.use(bodyParser.json());

//SERVER.get('PATH', CALLBACKFUNCTION )

webserver.use( express.static( __dirname + '/html') );

function initServer(){
    initializeStudentIds(students);
}
initServer();

function initializeStudentIds(arrayOfStudents) {
    for(let studentIndex in arrayOfStudents){
        addStudentIds(arrayOfStudents[studentIndex])
    }
    return arrayOfStudents;
}

function addStudentIds(studentObj) {
    studentObj.id=currentID++;
}

webserver.use(function (req, res, next) {
    next();
});

webserver.get('/students/get', function(req, res){
    let serverPacket = {
        'success':true,
        data:students,
    };

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342');
    res.send(serverPacket);
});
//notice that this is a post request, not a get request
webserver.post('/students/create', function(req, res){

    console.log(req.body);

    let {name, course, grade} = req.body;


    let newStudentObj = {name, course, grade};
    addStudentIds(newStudentObj);

    students.push(newStudentObj);

    let serverPacket = {
        'success':true,
        'new_id':newStudentObj.id,
    }

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342');
    res.send(serverPacket)

    //create a student here.
    //get listData from the post listData
    //	https://www.npmjs.com/package/body-parser
    //req.body.DATAYOUWANT
    //use that listData from the post listData to make new object
    //add the object to the array
});

//notice this is a delete request, not a get or post request
webserver.post('/students/delete', function(req, res){

    let studentIdToDelete = req.body.student_id;
    let deletedStudent=null;
    for(let studentIndex in students){
        if(students[studentIndex].id === parseInt(studentIdToDelete)){
            deletedStudent=students.splice(studentIndex,1);
        }
    }


    let serverPacket = {
        success:true,
        studentDeleted: deletedStudent,
    };
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342');
    res.send(serverPacket)

    //delete a student here
    //get the ID from the post listData
    //delete the item from the array
    //return true if you deleted it
    //remember your SGT was expecting listData like from our server
});



webserver.listen(3000, function(){
    console.log('server is listening');
})



