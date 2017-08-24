

//conver a google event to a feasy assignment
var convertEvent = function(googleEvent, id){
  let newEvent = {
    title:        googleEvent.summary,
    dueDate:      getDateTime(googleEvent.start),
    completed:    checkCompletion(googleEvent.end),
    userId:       id,
    googleAssignmentId: googleEvent.id,
  };
  newEvent =getDescription(newEvent,googleEvent);
  return newEvent;
}


//convert Date into DateTime with defualt time
var getDateTime = function (googleEvent){
  if (googleEvent.dateTime != undefined){
    return googleEvent.dateTime;
  }
  else return googleEvent.date+"T00:00:00";
}

//check the completion of an event by comparing events dateTime to current dateTime
var checkCompletion = function(googleEvent){
  var endTime = getDateTime(googleEvent);
  if (endTime < Date.now ){
    return true;
  }
  else return false;
}

var getDescription = function(convertEvent, googleEvent){
  if (googleEvent.description != undefined){
    convertEvent.description= googleEvent.description;
  }
  return convertEvent;
}

//TODO look into mongo eval for comparing to mongo collections? or do manual comparison of a string/map etc
//var comparison = function(googleEventList, id){}

//TODO add more to comparison/update, look into different email groups
//add to completion check times maybe. look into all properties of an event


module.exports = {
  convertEvent: convertEvent,
};
