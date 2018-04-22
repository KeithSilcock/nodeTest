$(window).on('load',function () {
    var studentGradingTable = new StudentGradeTableMVC();
})
class StudentGradeTableMVC{
    constructor(){
        this.model = new SGTModel(this.handleError.bind(this));
        this.view= new SGTView(this.interactWithServer.bind(this));
    }

    interactWithServer(argsToServer){
        var url='';
        var data={};
        var successFunc=null;
        if(argsToServer.command==='getData') {
            url = 'https://s-apis.learningfuze.com/sgt/get';
            successFunc = function (response) {
                this.view.successGetStudentList(response.data);
            }
        }else if (argsToServer.command==='createStudent'){
            url= 'https://s-apis.learningfuze.com/sgt/create';
            data=argsToServer.newStudent;
            successFunc = function (response) {
                this.view.successAddStudent(argsToServer.newStudent, response.new_id)
            }
        }else if (argsToServer.command==='deleteStudent'){
            url= 'https://s-apis.learningfuze.com/sgt/delete';
            data=argsToServer.idToDelete;
            successFunc = function (response) {
                this.view.successDeleteStudent(argsToServer.studentIndex, argsToServer.rowToDelete)
            }
        }

        this.model.reachOutToServer(url, data, successFunc.bind(this))
    }

    handleError(error){
        this.view.handleError(error)
    }
}

class SGTModel{
    constructor(errorCallback) {
        this.errorCallback = errorCallback;
    }

    reachOutToServer(url, data, successFunction){
        let ajaxArgs = {
            'dataType': 'json',
            'url': url,
            'method': 'POST',
            'data': {
                'api_key': 'T5a2qipvnG',
                // 'force-failure':'request',
            },
        };

        ajaxArgs.success = this.onServerSuccess(successFunction, this.handleServerError.bind(this));
        ajaxArgs.error = this.onServerError(this.handleServerError.bind(this));
        ajaxArgs.data = Object.assign(ajaxArgs.data, data);

        $.ajax(ajaxArgs)
    }

    onServerSuccess(successFunction, serverFailFunction){
        return function (response) {
            if(response.success) {
                successFunction(response);
            }else{
                serverFailFunction(null, response)
            }
        }
    }

    onServerError(failFunction){
       return function (response) {
           failFunction(response, null)
        }
    }

    handleServerError(failError, successError) {
        if(failError) {
            var errorText = {
                header: `Error: ${failError.status}`,
                bodyText: `${failError.statusText}`,
                extraText: `Extra info: ${failError.responseText}`,
            };
        }else if(successError){
            var errorText = {
                header: `Error!`,

                // extraText: `${successError.extraText}`,
            };

            if(successError.errors){
                errorText.bodyText= `${successError.errors[0]}`;
            }else{
                errorText.bodyText= `${successError.error[0]}`;
            }
        }
        this.errorCallback(errorText)
    }

}

class SGTView{
    constructor(serverRequestCallback){
        this.setOfCourses={};
        this.autoCompleteTimeout=null;

        this.serverRequestFunc=serverRequestCallback;

        this.addClickHandlersToElements();

        this.handleGetStudentList();
    }

    addClickHandlersToElements(){
        $('.addButton').on('click', this.handleAddClicked.bind(this));
        $('.clearButton').on('click', this.handleCancelClick.bind(this));
        $('[data-sort]').on('click', this.sortTable.bind(this));
        $(".getDataButton").on('click', this.handleGetStudentList.bind(this));

        $('#course').on({
            'keyup': this.onKeyUp.bind(this),
        })
    }

    handleGetStudentList(){
        this.setWaitingCursor(true);

        let argsToServer={
            command:'getData',
        }

        this.serverRequestFunc(argsToServer);
    }
    successGetStudentList(newStudentArray){
        this.setWaitingCursor(false);
        this.updateStudentList(newStudentArray)
    }

    handleAddClicked(){
        this.handleAddStudent();
    }
    handleAddStudent(){
        let newStudent = {
            name: $('#studentName').val(),
            course: $('#course').val(),
            grade: Number($('#studentGrade').val()),
        };

        let argsToServer = {
            command: 'createStudent',
            newStudent:newStudent,
        };

        this.serverRequestFunc(argsToServer);
    }
    successAddStudent(newStudent, newId){
        this.setWaitingCursor(false);
        this.clearAddStudentFormInputs();
        newStudent.id=newId;
        this.studentArray.push(newStudent);
        this.updateStudentList(this.studentArray);
    }

    handleDeleteStudent(student, index, rowToDelete){
        console.log(student)
        let argsToServer = {
            command:'deleteStudent',
            idToDelete: {
                'student_id':student.id
            },
            studentIndex:index,
            rowToDelete:rowToDelete,
        }
        this.serverRequestFunc(argsToServer);
    }
    successDeleteStudent(index, rowToRemove){
        this.setWaitingCursor(false);
        this.studentArray.splice(index, 1);
        rowToRemove.remove();
    }

    handleCancelClick(){
        this.clearAddStudentFormInputs();
    }

    renderStudentOnDom(student, index){
        let newRow = $("<tr>",{
            'class': 'deleteableRow'
        });

        let name=$("<td>",{
            text: student.name,
        });
        let course=$("<td>",{
            text: student.course,
        });
        let grade=$("<td>",{
            text: student.grade,
        });

        let buttonTD =$("<td>");
        let deleteBtn = $("<button>",{
            type: 'button',
            'class': 'btn btn-danger deleteButton',
            text: 'Delete',
        });

        (function (that) {
            deleteBtn.on('click', function () {
                that.handleDeleteStudent(student, index, newRow)
            })
        })(this);

        buttonTD.append(deleteBtn);
        newRow.append(name, course, grade, buttonTD);
        $(".studentTableBody").append(newRow)

    }
    updateStudentList(studentArray){
        this.studentArray = studentArray;
        $('.deleteableRow, #noData').remove();

        for(let studentIndex=0; studentIndex<studentArray.length; studentIndex++){
            let student=studentArray[studentIndex]
            this.renderStudentOnDom(student, studentIndex);

            //keep an object with all courses as keys for autocomplete
            this.setOfCourses[student.course]='';
        }

        if(studentArray.length===0) {
            var noData = $("<h2>", {
                text: 'No Data Available',
                'id':'noData'
            });
            $('#dataTable').append(noData)
        }

        let avg = this.calculateGradeAverage(studentArray);
        this.renderGradeAverage(avg);

    }
    calculateGradeAverage(studentArray){
        let totalGrade = studentArray.reduce( (sumSoFar, curr) =>  sumSoFar + curr.grade, 0)

        if(studentArray.length===0){
            return 0;
        }
        return (totalGrade/studentArray.length).toFixed(0);
    }
    renderGradeAverage(avg){
        $(".avgGrade").text(`${avg}%`)
    }


    sortTable(sortTableEvent){

        let jColumnClicked = $(sortTableEvent.target);
        let columnName = jColumnClicked[0].dataset.sort;
        let direction=1;

        let jArrowIndicator=$(`.arrow${columnName}`)
        if(jArrowIndicator.hasClass('arrowDown')){
            jArrowIndicator.removeClass('arrowDown').addClass('arrowUp');
        }else if(jArrowIndicator.hasClass('arrowUp')){
            direction = -1;
            jArrowIndicator.removeClass('arrowUp').addClass('arrowDown');
        }else if(jArrowIndicator.hasClass('arrowUnsorted')){
            jArrowIndicator.removeClass('arrowUnsorted').addClass('arrowUp');
        }

        resetOtherArrows(columnName);
        function resetOtherArrows(arrowToSkip) {
            let arrayOfColumns = ['name', 'course', 'grade'];
            for(let arrowIndex in arrayOfColumns){
                if(arrayOfColumns[arrowIndex] !== arrowToSkip){
                    $(`.arrow${arrayOfColumns[arrowIndex]}`).removeClass('arrowUp')
                        .removeClass('arrowDown')
                        .addClass('arrowUnsorted');
                }
            }
        }

        if(typeof this.studentArray[0][columnName]==='number'){
            this.studentArray.sort(function (a,b) {
                return (b[columnName]-a[columnName]) * direction;
            })
        }else {
            this.studentArray.sort(function (a, b) {
                let comp = 0;
                let sortA=a[columnName].toLowerCase();
                let sortB=b[columnName].toLowerCase();

                if ( sortA > sortB ) {
                    comp = 1;
                } else if ( sortB > sortA ) {
                    comp = -1;
                }

                return comp * direction
            });
        }

        this.updateStudentList(this.studentArray)
    }

    onKeyUp(event) {

        if(event.key==='Escape'){
            this.removeAutoCompleteUL();
        }else if(!this.autoCompleteTimeout) {
            this.autoCompleteTimeout = setTimeout(this.autoCompleteCourse.bind(this), 500);
        }else{
            clearTimeout(this.autoCompleteTimeout);
            this.autoCompleteTimeout = setTimeout(this.autoCompleteCourse.bind(this), 500);
        }
    }
    autoCompleteCourse() {
        let courseInput = $('#course');
        courseInput.on('focusout', this.removeAutoCompleteUL)
        let lettersSoFar = courseInput.val().toLowerCase();

        if(lettersSoFar.length===0){
            this.removeAutoCompleteUL();
            return;
        }

        let autoCompleteUL=$("<ul>",{
            'id':'autoComplete',
        });
        autoCompleteUL.on('click', '#autoCompleteLI', autoComplete);

        let allAutoCorrectMatches = [];
        for(let course in this.setOfCourses){
            let sliceToCheck = course.toLowerCase().slice(0,lettersSoFar.length);
            if(course.length === lettersSoFar.length){
                this.removeAutoCompleteUL();
                continue;
            }
            if(sliceToCheck === lettersSoFar && lettersSoFar.length>0){
                let autoCompleteLI = $("<li>",{
                    text:course,
                    'id':'autoCompleteLI',
                });
                allAutoCorrectMatches.push(autoCompleteLI)
            }else{
                this.removeAutoCompleteUL();
            }
        }

        if(allAutoCorrectMatches.length>0){
            for(let index in allAutoCorrectMatches){
                autoCompleteUL.append(allAutoCorrectMatches[index])
            }
            $("#courseCont").append(autoCompleteUL)
        }

        function autoComplete(event) {
            var clickedObj=event.target;
            courseInput.val(clickedObj.outerText);
            this.removeAutoCompleteUL()
        }
    }

    removeAutoCompleteUL(){
        $("#autoComplete").remove();
    }

    handleError(error){
        this.openModal(error);
    }
    openModal(modalTextObj) {
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

    clearAddStudentFormInputs(){
        $('input.student').val('');
    }

    setWaitingCursor(state){
        if(state) {
            $('body').css('cursor', 'progress');
        }else{
            $('body').css('cursor', 'default');
        }
    }
}