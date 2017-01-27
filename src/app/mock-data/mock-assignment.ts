import { Assignment } from '../objects/assignment';

export const ASSIGNMENTS: Assignment[] = [
  {type: 'homework', name: 'Chapter 2 problems', due: Math.round(+new Date()/1000) + 129600, user_id: 2, assign_id: 12, completed: false},
  {type: 'homework', name: 'Chapter 3 problems', due: Math.round(+new Date()/1000) + 172800, user_id: 2, assign_id: 13, completed: false},
  {type: 'homework', name: 'Chapter 4 problems', due: Math.round(+new Date()/1000) + 345600, user_id: 2, assign_id: 14, completed: false},
  {type: 'homework', name: 'Chapter 5 problems', due: Math.round(+new Date()/1000) + 518400, user_id: 3, assign_id: 13, completed: false},
  {type: 'test',     name: 'Midterm 2',          due: Math.round(+new Date()/1000) + 103680, user_id: 3, assign_id: 14, completed: false}
];
