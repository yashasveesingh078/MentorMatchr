const express = require('express');
const { verifyToken, allowRole } = require('../middleware/auth');
const { searchMentors, assignMentor, listMentors } = require('../controllers/coordinatorController');

const router = express.Router();

// Every route below needs a logged-in coordinator
router.use(verifyToken, allowRole('coordinator'));

router.post('/search', searchMentors);
router.post('/assign', assignMentor);
router.get('/mentors', listMentors);

module.exports = router;