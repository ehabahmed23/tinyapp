function generateRandomString() {
  const result = Math.random().toString(36).substring(7);
  return result
};

const findUserByEmail = (email, users) => {
  // for (let key in database)
    for (let id in users) {
      const user = users[id]; // => retrieve the value that's in id 
      if (user.email === email) {
        return user;
      }
    }
    return false;
};


function urlsForUser(id, database) {
  let result = {};
  for (const url in database) {
    if (id === database[url].userID) {
      result[url] = database[url]
    }
  }
  return result;
};

module.exports = {
  generateRandomString,
  findUserByEmail,
  urlsForUser
};