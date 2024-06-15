module.exports = class Parser {

  static async parse (context, content) {
    let newContent = this.replaceVars(context, content);
    newContent = await this.replaceRoles(context, newContent);
    newContent = this.replaceChoose(context, newContent);
    newContent = this.replaceMath(context, newContent);

    return newContent;
  }

  // Replace variable placeholders in the content with actual values from the context
  static replaceVars (context, content) {
    const REPLACERS = {
      '{user}': context.user.globalName,
      '{userid}': context.user.id,
      '{serverid}': context.guildID,
      '{channelid}': context.channelID,
      '{allargs}': (context.options || [])[0] ? context.options[0].value : ''
    };

    // Replace each variable placeholder with its corresponding value
    Object.keys(REPLACERS).forEach((variable) => {
      content = content.replace(new RegExp(variable, 'g'), REPLACERS[variable]);
    });

    return content;
  }

  // Replace role-related placeholders in the content and perform role actions
  static async replaceRoles (context, content) {
    // Add roles to the user
    const addRoles = content.match(/{addrole:(\d+)}/g);
    addRoles?.forEach((role) => {
      const roleID = role.replace('{addrole:', '').replace('}', '');
      this.core.rest.api.guilds(context.guildID).members(context.user.id).roles(roleID).put({
        auditLogReason: `Custom Command Action: ${context.name}`
      }).catch();
      content = content.replace(role, '');
    });

    // Remove roles from the user
    const removeRoles = content.match(/{removerole:(\d+)}/g);
    removeRoles?.forEach((role) => {
      let roleID = role.replace('{removerole:', '').replace('}', '');
      this.core.rest.api.guilds(context.guildID).members(context.user.id).roles(roleID).delete({
        auditLogReason: `Custom Command Action: ${context.name}`
      }).catch();
      content = content.replace(role, '');
    });

    return content;
  }

  static replaceChoose (context, content) {
    // Replace {choose:...} placeholders with a random choice from the options
    const choose = content.match(/{choose:(.*)}/g) || [];
    choose.forEach((replacing) => {
      let options = replacing.replace('{choose:', '').replace('}', '').split('|');
      let chose = options[Math.floor(Math.random() * options.length)];
      content = content.replace(replacing, chose);
    });

    return content;
  }

  static replaceMath (_, content) {
    // Replace {add:...} placeholders with the sum of the two numbers
    const mathAdd = content.match(/{add:(\d*)\+(\d*)}/g) || [];
    mathAdd.forEach((replacing) => {
      let [one, two] = replacing.replace('{add:', '').replace('}', '').split('+');
      let msg = '';
      if (parseInt(one) && parseInt(two)) {
        msg = parseInt(one) + parseInt(two);
      }
      content = content.replace(replacing, msg);
    });


    const mathSubtract = content.match(/{subtract:(\d*)-(\d*)}/g) || [];
    mathSubtract.forEach((replacing) => {
      let [one, two] = replacing.replace('{subtract:', '').replace('}', '').split('-');
      let msg = '';
      if (parseInt(one) && parseInt(two)) {
        msg = parseInt(one) - parseInt(two);
      }
      content = content.replace(replacing, msg);
    });

    const mathMultiply = content.match(/{multiply:(\d*)\*(\d*)}/g) || [];
    mathMultiply.forEach((replacing) => {
      let [one, two] = replacing.replace('{multiply:', '').replace('}', '').split('*');
      let msg = '';
      if (parseInt(one) && parseInt(two)) {
        msg = parseInt(one) * parseInt(two);
      }
      content = content.replace(replacing, msg);
    });

    const mathDivide = content.match(/{divide:(\d*)\/(\d*)}/g) || [];
    mathDivide.forEach((replacing) => {
      let [one, two] = replacing.replace('{divide:', '').replace('}', '').split('/');
      let msg = '';
      if (parseInt(one) && parseInt(two)) {
        msg = parseInt(one) / parseInt(two);
      }
      content = content.replace(replacing, msg);
    });

    return content;
  }

};
