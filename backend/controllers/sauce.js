const Thing = require('../models/sauce');
const fs = require('fs');

exports.createThing = (req, res, next) => {
  const thingObject = JSON.parse(req.body.thing)
  delete thingObject._id;
  const thing = new Thing({
    ...thingObject,
    imageUrl:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  thing.save()
    .then(() => res.status(201).json({message: 'Objet enregistré !)'}))
    .catch(error => res.status(400).json({error}));
};

exports.modifyThing = (req, res, next) => {
  const thingObject = req.file ?
    {
      ...JSON.parse(req.body.thing),
      imageUrl:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body}
  Thing.updateOne({_id: req.params.id}, {...thingObject, _id: req.params.id})
    .then(() => res.status(200).json({message: 'Objet modifié !'}))
    .catch(error => res.status(400).json({error}));
};

exports.deleteThing = (req, res, next) => {
  Thing.findOne({_id:req.params.id})
    .then(thing => {
      const filename = thing.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Thing.deleteOne({_id: req.params.id})
          .then(() => res.status(200).json({message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({error}));
      });
    })
    .catch(error => res.status(500).json({error}));
};

exports.getOneThing = (req, res, next) => {
  Thing.findOne({ _id: req.params.id })
    .then(thing => res.status(200).json(thing))
    .catch(error => res.status(404).json({error}));
};

exports.getAllThings = (req, res, next) => {
  Thing.find()
    .then(things => res.status(200).json(things))
    .catch(error => res.status(400).json({error}));
};

exports.likeThing = (req, res, next) => {
  let userId = req.body.userId, like = req.body.like;
  
  Thing.findOne({ _id: req.params.id }).exec(function (error, thing){
    let msg = "", userLike = thing.usersLiked.indexOf(userId), userDisliked = thing.usersDisliked.indexOf(userId);
    
    if(like == 0 && userLike >-1){
      thing.likes--;
      thing.usersLiked.splice(userLike,1);
      msg = "Unliked !";
    } else if (like == 0 && userDisliked >-1) {
      thing.dislikes--;
      thing.usersDisliked.splice(userDisliked,1);
      msg = "Undisliked !";
    };

    if (like == 1) {
      thing.likes++;
      if (thing.usersLiked.length == 0){
        thing.usersLiked=[userId];
      } else {
        thing.usersLiked.push(userId);
      }
      msg = "Like pris en compte !";
    };

    if (like == -1) {
      thing.dislikes++;
      if (thing.usersDisliked.length == 0) {
        thing.usersDisliked=[userId];
      } else {
        thing.usersDisliked.push(userId);
      }
      msg = "Disike pris en compte !";
    };

    thing.save()
      .then(() => res.status(201).json({ message: msg}))
      .catch(error => res.status(400).json({ error }));
  });
};