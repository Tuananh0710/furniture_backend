const adminController=require('../controllers/adminComtroller');
const {adminAuth,authorize} = require('../middlewares/auth');
const express= require('express');
const router= express.Router();

router.get('/',adminAuth,adminController.dashBoard);

module.exports=router;