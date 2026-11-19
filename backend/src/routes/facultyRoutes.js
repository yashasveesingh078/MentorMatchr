const express = require('express');
const { verifyToken, allowRole } = require('../middleware/auth');
const { myTeams } = require('../controllers/facultyController');

const router = express.Router();

// Every route below needs a logged-in faculty member
router.use(verifyToken, allowRole('faculty'));

router.get('/my-teams', myTeams);

module.exports = router;