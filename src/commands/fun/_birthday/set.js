const { ApplicationCommandOptionType } = require('../../../constants/Types');
const Command = require('../../../framework/Command');

module.exports = class extends Command {

  constructor (...args) {
    super(...args, {
      name: 'set',
      description: 'Sets your birthday!',
      options: [
        { name: 'birthday', description: 'Date of your birthday (in DD/MM format)', type: ApplicationCommandOptionType.String, required: true }
      ]
    });
  }

  async run ({ args: { birthday }, userSettings }) {
    const converted = this.convert(birthday.value);
    userSettings.set('birthday', converted);
    await userSettings.save();

    return new Command.InteractionResponse()
      .setContent(`Your birthday is now set to **${converted.string}**!`)
      .setEmoji('check');
  }

  convert (birthday) {
    const months = {
      1: 'January',
      2: 'February',
      3: 'March',
      4: 'April',
      5: 'May',
      6: 'June',
      7: 'July',
      8: 'August',
      9: 'September',
      10: 'October',
      11: 'November',
      12: 'December'
    };

    let [day, month] = birthday.split('/');
    day = parseInt(day);
    month = parseInt(month);

    return {
      string: `${day} ${months[month]}`,
      day,
      month
    };
  }

};
