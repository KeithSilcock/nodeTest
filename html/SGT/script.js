/* information about jsdocs: 
* param: http://usejsdoc.org/tags-param.html#examples
* returns: http://usejsdoc.org/tags-returns.html
* 
/**
 * Listen for the document to load and initialize the application
 */
$(document).ready(initializeApp);

var studentArray=[]
// [{name:'Keith', course:'chemistry', grade:80},
// {name:'Kev', course:'chemistry', grade:90},
// {name:'Ryle', course:'chemistry2', grade:60},
// {name:'asdf', course:'chemistry3', grade:50},
// {name:'jjjjjj', course:'appleBees', grade:40}];
var listOfCourses={};
var currentTimeOut=null;

function initializeApp(){
    addClickHandlersToElements();
    updateStudentList(studentArray);
    getDataFromServer();
}

function addClickHandlersToElements(){
    $('.addButton').on('click', handleAddClicked);
    $('.clearButton').on('click', handleCancelClick);
    $('.arrowSegment').on('click', sortTable);
    $(".getDataButton").on('click', getDataFromServer);

    $('#course').on({
        'keyup': this.onKeyUp,
    })
}
function handleAddClicked(){
    addStudent();
}

function handleCancelClick(){
    clearAddStudentFormInputs();
}

function setWaitingCursor(state){
    if(state) {
        $('body').css('cursor', 'progress');
    }else{
        $('body').css('cursor', 'default');
    }
}
function handleDataFromServer(dataObj) {
    studentArray=dataObj.data;
    updateStudentList(studentArray);
}

function getDataFromServer() {
    var ajaxArgs = {
        'dataType': 'json',
        'url': 'http://localhost:3000/students/get',
        'method': 'GET',
        'data': {
            // 'api_key': 'T5a2qipvnG',
        },
        'success':function (result) {
            console.log(result);
            if(result.success) {
                handleDataFromServer(result);
            }else{
                result.extraText='Could not get students from server. Please try again.'
                handleServerError(null, result)
            }
            setWaitingCursor(false);
        },
        'error':function (xhr, status, error) {
            handleServerError(xhr, null);
            setWaitingCursor(false);
        }
    };
    ajaxRequest(ajaxArgs);
}
function addStudentToServer(studentToSend) {
    var ajaxArgs = {
        'dataType': 'json',
        'url': 'http://localhost:3000/students/create',
        'method': 'POST',
        'data': {
            // 'api_key': 'T5a2qipvnG',
            name: studentToSend.name,
            course: studentToSend.course,
            grade: studentToSend.grade,

        },
        'success': function (result) {
            console.log(result);
            if (result.success) {
                studentToSend.id = result.new_id;
                studentArray.push(studentToSend);
                updateStudentList(studentArray);
                clearAddStudentFormInputs();
            } else {
                result.extraText='Could not add student to server. Please try again.'
                handleServerError(null, result)
            }
            setWaitingCursor(false)
        },
        'error': function (xhr, status, error) {
            handleServerError(xhr, null);
            setWaitingCursor(false);
        }
    };

    ajaxRequest(ajaxArgs);
}
function deleteStudentFromSever(studentToDelete, index, rowToDelete) {
    var ajaxArgs = {
        'dataType': 'json',
        'url': 'http://localhost:3000/students/delete',
        'method': 'POST',
        'data': {
            'api_key': 'T5a2qipvnG',
            student_id: studentToDelete.id,
        },
        'success':function (result, stuff, stuff2) {
            console.log(result);
            console.log(stuff);
            console.log(stuff2);
            if(result.success) {
                studentArray.splice(index, 1);
                rowToDelete.remove();
            }else{
                result.extraText='Could not delete student from server. Please try again.'
                handleServerError(null, result);
            }
            setWaitingCursor(false)

        },
        'error':function (xhr, status, error) {
            handleServerError(xhr, null);
            setWaitingCursor(false);
        }
    };

    ajaxRequest(ajaxArgs);
}
function ajaxRequest(ajaxArgs) {
    $.ajax(ajaxArgs)
    setWaitingCursor(true)
}
function handleServerError(failError, successError) {
    if(failError) {
        var errorText = {
            header: `Error: ${failError.status}`,
            bodyText: `${failError.statusText}`,
            extraText: `Extra info: ${failError.responseText}`,
        };
        openModal(errorText)
    }
    if(successError){
        var errorText = {
            header: `Error!`,
            bodyText: `${successError.errors}`,
            extraText: `${successError.extraText}`,
        };
        openModal(errorText);
    }
}

function addStudent(){
    var newStudent = {
        name: $('#studentName').val(),
        course: $('#course').val(),
        grade: Number($('#studentGrade').val()),
    };

    addStudentToServer(newStudent);
}

function clearAddStudentFormInputs(){
    $('#studentName').val('');
    $('#course').val('');
    $('#studentGrade').val('');
}

function renderStudentOnDom(student, index){
    var newRow = $("<tr>",{
        'class': 'deleteableRow'
    });

    var name=$("<td>",{
        text: student.name,
    });
    var course=$("<td>",{
        text: student.course,
    });
    var grade=$("<td>",{
        text: student.grade,
    });

    var buttonTD =$("<td>");
    var deleteBtn = $("<button>",{
        type: 'button',
        'class': 'btn btn-danger deleteButton',
        text: 'Delete',
    });

    (function () {
        deleteBtn.on('click', function () {
            console.log(student)
            deleteStudentFromSever(student, index, newRow);
        })
    })();

    buttonTD.append(deleteBtn);
    newRow.append(name, course, grade, buttonTD);
    $(".studentTableBody").append(newRow)

}

function updateStudentList(studentArray){
    $('.deleteableRow, #noData').remove();

    for(var studentIndex=0; studentIndex<studentArray.length; studentIndex++){
        renderStudentOnDom(studentArray[studentIndex], studentIndex);
        listOfCourses[studentArray[studentIndex].course]='';
    }

    if(studentArray.length===0) {
        var noData = $("<h2>", {
            text: 'No Data Available',
            'id':'noData'
        });
        $('.dataTable').append(noData)
    }

    var avg = calculateGradeAverage();
    renderGradeAverage(avg);

}

function calculateGradeAverage(){
    var totalGrade=0;
    for(var studentIndex=0; studentIndex<studentArray.length; studentIndex++){
        student=studentArray[studentIndex];
        totalGrade+=Number(student.grade);
    }
    if(studentArray.length===0){
        return 0;
    }
    return (totalGrade/studentArray.length).toFixed(0);
}

function renderGradeAverage(avg){
    $(".avgGrade").text(`${avg}%`)
}


function onKeyUp(event) {
    if(!currentTimeOut) {
        currentTimeOut = setTimeout(autoCompleteCourse, 500);
    }else{
        clearTimeout(currentTimeOut);
        currentTimeOut = setTimeout(autoCompleteCourse, 500);
    }
}
function autoCompleteCourse() {
    var courseInput = $('#course')
    var lettersSoFar = courseInput.val().toLowerCase();

    if(lettersSoFar.length===0){
        removeUL();
        return;
    }

    var autoCompleteUL=$("<ul>",{
        'class':'autoComplete',
    });
    autoCompleteUL.on('click', '.autoCompleteLI', autoComplete);

    var allAutoCorrectMatches = [];
    for(var course in listOfCourses){
        var sliceToCheck = course.toLocaleLowerCase().slice(0,lettersSoFar.length);
        if(course.length === lettersSoFar.length){
            removeUL();
            continue;
        }
        if(sliceToCheck === lettersSoFar && lettersSoFar.length>0){
            var autoCompleteLI = $("<li>",{
                text:course,
                'class':'autoCompleteLI',
            });
            allAutoCorrectMatches.push(autoCompleteLI)
        }else{
            removeUL();
        }
    }

    if(allAutoCorrectMatches.length>0){
        for(var index in allAutoCorrectMatches){
            autoCompleteUL.append(allAutoCorrectMatches[index])
        }
        $("#courseCont").append(autoCompleteUL)
    }

    function autoComplete(event) {
        var clickedObj=event.target;
        courseInput.val(clickedObj.outerText)
        removeUL()
    }
    function removeUL() {
        $(".autoComplete").remove();
    }
}

function sortTable(event){
    var jTarget = $(event.target)
    var columnClicked=event.target.classList[1].slice(4).toLowerCase();
    var direction=1;

    if(jTarget.hasClass('arrowDown')){
        jTarget.removeClass('arrowDown');
        jTarget.addClass('arrowUp')
    }else if(jTarget.hasClass('arrowUp')){
        direction = -1;
        jTarget.removeClass('arrowUp');
        jTarget.addClass('arrowDown')
    }else if(jTarget.hasClass('arrowNone')){
        jTarget.removeClass('arrowNone');
        jTarget.addClass('arrowUp')
    }
    resetOtherArrows(columnClicked)
    function resetOtherArrows(arrowToSkip) {
        var arrayOfColumns = ['Name', 'Course', 'Grade'];
        for(var arrowIndex in arrayOfColumns){
            if(arrayOfColumns[arrowIndex].toLocaleLowerCase() !== arrowToSkip){
                $(`.sort${arrayOfColumns[arrowIndex]}`).removeClass('arrowUp')
                    .removeClass('arrowDown')
                    .addClass('arrowUnsorted');
            }
        }
    }

    // if(event.target.classList[1] === 'arrowDown'){
    //     direction = -1;
    //     $(`.arrowUp.${event.target.classList[2]}`).addClass('show').removeClass('hide');
    // }else{
    //     $(`.arrowDown.${event.target.classList[2]}`).addClass('show').removeClass('hide');
    // }
    // $(event.target).addClass('hide').removeClass('show');


    if(typeof studentArray[0][columnClicked]==='number'){
        studentArray.sort(function (a,b) {
            return (b[columnClicked]-a[columnClicked]) * direction;
        })
    }else {
        studentArray.sort(function (a, b) {
            var comp = 0;
            if (a[columnClicked].toLocaleLowerCase() > b[columnClicked].toLocaleLowerCase()) {
                comp = 1;
            } else if (b[columnClicked].toLocaleLowerCase() > a[columnClicked].toLocaleLowerCase()) {
                comp = -1;
            }
            return comp * direction
        });
    }

    updateStudentList(studentArray)
}

function openModal(modalTextObj) {
    var modal = $('#errorModal');
    modal.css('display', 'block');

    var modalH2 = $('.errorHeader').text(modalTextObj.header);
    var modalText = $('.errorText').text(modalTextObj.bodyText);
    var modalExtraText = $('.errorExtra').text(modalTextObj.extraText)

    var closeModal = $(".errorModalClose");
    modal.on({
        'click': function () {
            modal.css('display', 'none');
        }
    });
    closeModal.on({
        'click': function () {
            modal.css('display', 'none');
        }
    });
}