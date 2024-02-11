console.log("test")

let dataToSend = {
    'name': "nameth",
    'age': "nameth",
    'someObject': {
        'insideSomeObject': 123,
        'test array': [1, 2, 3],
        'test array of objects': [
            { 'obj': 1 }, { 'obj2': "text" }
        ]
    },
}

// console.log(JSON.parse(JSON.stringify(dataToSend)));

// fetch('http://localhost:3000/postFile', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json; charset=UTF-8' },
//     body: JSON.stringify(dataToSend)
// }).then(res => console.log(res));


fetch(`http://localhost:3000/readFile?filename=a.txt`).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Data received:', data);
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });
