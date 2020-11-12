//import logo from './logo.svg';
import './App.css';
//Added Later for auth
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
//End

//Added Later for api
import React, { useState, useEffect } from 'react';
import { API, /*for Storage */Storage } from 'aws-amplify';
import { listTodos } from './graphql/queries';
import { createTodo as createTodoMutation, deleteTodo as deleteTodoMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }
//End 

function App() {

  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  //for Storage
  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listTodos });
    //storage...checking if todo is asso. with an img
    const todosFromAPI = apiData.data.listTodos.items;
    await Promise.all(todosFromAPI.map(async todo => {
      if (todo.image) {
        const image = await Storage.get(todo.image);
        todo.image = image;
      }
      return todo;
    }))
    //end storage code
    setNotes(apiData.data.listTodos.items);
  }

  async function createTodo() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createTodoMutation, variables: { input: formData } });
    //Storage code
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    //end storage code
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteTodo({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteTodoMutation, variables: { input: { id } }});
  }

  return (
    <div className="App">
      <AmplifySignOut/>
      <h1>My Notes App</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
      /><br/><br/>
      <textarea
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
      /><br/><br/>
      <input
        type="file"
        onChange={onChange}
      /><br/><br/>
      <button onClick={createTodo}>Create Note</button><br/><br/>
      <div style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              {
                note.image && <img src={note.image} style={{width: 400}} />
              }
              <button onClick={() => deleteTodo(note)}>Delete note</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default withAuthenticator(App);
