const { updateScore } = require('../utils/scoringUtils');

exports.updateBScore = async (req, res) => {
  const { nickname, score } = req.body;
  try {
    await updateScore('b_user', nickname, score);
    res.status(200).send('Score updated');
  } catch (error) {
    res.status(500).send('Server error');
  }
};
