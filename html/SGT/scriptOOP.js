$(window).on('load',function () {
    var studentGradingTable = new StudentGradeTableClient();
    studentGradingTable.getStudentList();
})

class StudentGradeTableClient{
    constructor(){
        this.setOfCourses={};
        this.autoCompleteTimeout=null;
        this.focusOutTimeout=null;
        this.serverConnection= new AjaxServerRequester(this.handleError.bind(this));

        this.addClickHandlersToElements();
    }

    addClickHandlersToElements(){
        $('.addButton').on('click', this.handleAddClicked.bind(this));
        $('.clearButton').on('click', this.handleCancelClick.bind(this));
        $('[listData-sort]').on('click', this.sortTable.bind(this));
        $(".getDataButton").on('click', this.handleGetStudentList.bind(this));

        $('#course').on({
            'keyup': this.onKeyUp.bind(this),
            'focusout': this.onFocusOutCloseAutoComplete.bind(this),
        });
    }
    interactWithServer(argsToServer){
        this.setWaitingCursor(true);
        let url='';
        let data={
            'api_key': 'T5a2qipvnG',
            // 'force-failure':'timeout',
        };
        let method='GET';
        let successFunc=null;
        if(argsToServer.command==='getData') {
            url = 'http://localhost:3000/students/get';
            method = 'GET';
            successFunc = function (response) {
                this.successGetStudentList(response.data);
            }
        }else if (argsToServer.command==='createStudent'){
            url= 'https://s-apis.learningfuze.com/sgt/create';

            argsToServer.data=Object.assign(data, argsToServer.newStudent);

            successFunc = function (response) {
                this.successAddStudent(argsToServer.newStudent, response.new_id);
            }
        }else if (argsToServer.command==='deleteStudent'){
            url= 'https://s-apis.learningfuze.com/sgt/delete';

            argsToServer.data=Object.assign(data, argsToServer.idToDelete);

            successFunc = function (response) {
                this.successDeleteStudent(argsToServer.studentIndex, argsToServer.rowToDelete);
            }
        }
        let error = this.serverConnection.reachOutToServer(url, data, method, successFunc.bind(this));
        if(error){
            this.handleError(error);
        }
    }

    getStudentList(){
        this.handleGetStudentList();
    }

    handleGetStudentList(){
        let argsToServer={
            command:'getData',
        };
        this.interactWithServer(argsToServer);
    }
    successGetStudentList(newStudentArray){
        console.log(newStudentArray)
        this.setWaitingCursor(false);
        this.updateStudentList(newStudentArray);
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

        this.interactWithServer(argsToServer);
    }
    successAddStudent(newStudent, newId){
        this.setWaitingCursor(false);
        this.clearAddStudentFormInputs();
        newStudent.id=newId;
        this.studentArray.push(newStudent);
        this.updateStudentList(this.studentArray);
    }

    handleDeleteStudent(student, index, rowToDelete){
        let argsToServer = {
            command:'deleteStudent',
            idToDelete: {
                'student_id':student.id
            },
            studentIndex:index,
            rowToDelete:rowToDelete,
        };
        this.interactWithServer(argsToServer);
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

        for(var studentIndex=0; studentIndex<studentArray.length; studentIndex++){
            let student=studentArray[studentIndex];
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
        $(".avgGrade").text(`${avg}%`);
    }

    sortTable(sortTableEvent){

        let jColumnClicked = $(sortTableEvent.target);
        let columnName = jColumnClicked[0].dataset.sort;
        let direction=1;

        let jArrowIndicator=$(`.arrow${columnName}`);
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

                return comp * direction;
            });
        }

        this.updateStudentList(this.studentArray);
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
    onFocusOutCloseAutoComplete(event){
        if(!this.focusOutTimeout) {
            this.focusOutTimeout = setTimeout(this.removeAutoCompleteUL, 200);
        }else{
            clearTimeout(this.focusOutTimeout);
            this.focusOutTimeout = setTimeout(this.removeAutoCompleteUL, 200);
        }
    }
    autoCompleteCourse() {
        let courseInput = $('#course');
        let lettersSoFar = courseInput.val().toLowerCase();

        if(lettersSoFar.length===0){
            this.removeAutoCompleteUL();
            return;
        }

        let autoCompleteUL=$("<ul>",{
            'id':'autoComplete',
        });
        autoCompleteUL.on('click', '#autoCompleteLI', autoComplete.bind(this));

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
                allAutoCorrectMatches.push(autoCompleteLI);
            }
        }

        if(allAutoCorrectMatches.length>0){
            for(let index in allAutoCorrectMatches){
                autoCompleteUL.append(allAutoCorrectMatches[index]);
            }
            $("#courseCont").append(autoCompleteUL);
        }

        function autoComplete(event) {
            var clickedObj=event.target;
            courseInput.val(clickedObj.outerText);
            this.removeAutoCompleteUL();
        }
    }
    removeAutoCompleteUL(event){
        $("#autoComplete").remove();
    }

    handleError(error){
        this.setWaitingCursor(false);
        this.openModal(error);
    }
    openModal(modalTextObj) {
        let modal = $('#errorModal');
        modal.css('display', 'block');

        let modalH2 = $('.errorHeader').text(modalTextObj.header);
        let modalText = $('.errorText').text(modalTextObj.bodyText);
        let modalExtraText = $('.errorExtra').text(modalTextObj.extraText);

        let closeModal = $(".errorModalClose");
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

class AjaxServerRequester{
    constructor(errorCallBack, dataType='json', method='GET'){
        this.dataType=dataType;
        this.method=method;
        this.errorCallback=errorCallBack;
    }

    reachOutToServer(url, data, method, successFunction) {
        let ajaxArgs = {
            'dataType': this.dataType,
            'url': url,
            'method': method,
            'data':data,
        };
        ajaxArgs.success = this.onServerSuccess(successFunction).bind(this);
        ajaxArgs.error = this.handleServerError.bind(this);

        $.ajax(ajaxArgs);
    }
    onServerSuccess(successFunction){
        return function (response) {
            if(response.success) {
                successFunction(response);
            }else{
                this.handleServerError(null, response);
            }
        }
    }
    handleServerError(failErrorObj, successErrorObj) {
        if(failErrorObj) {
            var errorText = {
                header: `Error: ${failErrorObj.status}`,
                bodyText: `${failErrorObj.statusText}`,
                extraText: `Extra info: ${failErrorObj.responseText}`,
            };
        }else if(successErrorObj){
            var errorText = {
                header: `Error!`,
                // extraText: `${successError.extraText}`,
            };

            if(successErrorObj.errors){
                errorText.bodyText= `${successErrorObj.errors[0]}`;
            }else{
                errorText.bodyText= `${successErrorObj.error[0]}`;
            }
        }
        this.errorCallback(errorText);
    }
}