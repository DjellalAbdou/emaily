const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const requireCredits = require("../middleware/requireCredits");
const Mailer = require("../services/Mailer");
const surveyTemplate = require("../services/emailTemplates/surveyTemplate");
const { URL } = require("url");
const _ = require("lodash");
const Path = require("path-parser").default;
const Survey = mongoose.model("surveys");

module.exports = app => {
  app.get("/api/surveys/:surveyId/:choice", (req, res) => {
    console.log("khra1");
    res.send("Thanks for voting!");
  });

  app.get("/api/surveys", requireLogin, async (req, res) => {
    const surveys = await Survey.find({ _user: req.user.id }).select({
      recipients: false
    });

    res.send(surveys);
  });

  app.get("/api/hhh", (req, res) => {
    console.log("khra2");
    res.send("Thanks for voting!");
  });

  app.get("/api/lodash", (req, res) => {
    let array = _.uniqBy([{ n: 1 }, { n: 1 }, { n: 1 }, { n: 1 }], "n");
    console.log(array);
    res.send({});
  });

  app.post("/api/surveys/webhooks", (req, res) => {
    const p = new Path("/api/surveys/:surveyId/:choice");
    try {
      const uniqtable = _.uniqBy(
        _.compact(
          _.map(req.body, ({ email, url }) => {
            //console.log("kjkahjjhkjfljshfbjmkd");
            const match = p.test(new URL(url).pathname);
            //console.log(match + " here is match");
            if (match)
              return { email, surveyId: match.surveyId, choice: match.choice };
          })
        ),
        "email",
        "surveyId"
      );

      _.each(uniqtable, ({ surveyId, email, choice }) => {
        Survey.updateOne(
          {
            _id: surveyId,
            recipients: {
              $elemMatch: { email, responded: false }
            }
          },
          {
            $inc: { [choice]: 1 },
            $set: { "recipients.$.responded": true },
            lastResponded: new Date()
          }
        ).exec();
        console.log("exec this one");
      });
    } catch (err) {
      console.log(err);
    }

    res.send({});
  });

  app.post("/api/surveys", requireLogin, requireCredits, async (req, res) => {
    const { title, subject, body, recipients } = req.body;

    const survey = new Survey({
      title,
      subject,
      body,
      recipients: recipients.split(",").map(email => ({ email: email.trim() })),
      _user: req.user.id,
      dateSent: Date.now()
    });

    const mailer = new Mailer(survey, surveyTemplate(survey));
    try {
      await mailer.send();
      await survey.save();
      req.user.credits -= 1;
      const user = await req.user.save();
      res.send(user);
    } catch {
      res.status(422).send(err);
    }
  });
};
