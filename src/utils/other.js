const checkAccept = (lifetime) => {
  if (!lifetime) return false;
  if (Date.parse(lifetime) - Date.now() < -24 * 60 * 60 * 1000) {
    console.log(false);
    return false;
  }
  return true;
};

module.exports = {
  checkAccept,
};
