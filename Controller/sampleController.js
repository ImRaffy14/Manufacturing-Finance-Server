const mongoose = require('mongoose')
const sampleData = require('../Model/sampleModel')


//GET ALL DATA
const getAll = async (req, res) => {
    const data = await sampleData.find({}).sort({createdAt: -1})
    
    if(!data){
        return res.status(404).json({msg:'ERROR TO FIND DATA'})
    }

    res.status(200).json(data)
}

//POST DATA
const storeData = async (req, res) => {
    const { name, age } = req.body

    try{
        const data = await sampleData.create({name, age})

        if(!data){
            return res.status(400).json({msg:'BOSS TANGA KA BA TALAGA?'})
        }
        res.status(200).json({msg:'created you shit'})
    } catch( error ){
        res.status(400).json({msg: error})
    }
}


module.exports = {
    getAll,
    storeData
}