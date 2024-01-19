const { InteractionResponseType, MessageFlags } = require('../../constants/Types');
const InteractionComponentResponse = require('./InteractionComponentResponse');
const { Colours } = require('../../constants/Colours');
const Emojis = require('../../constants/Emojis');

module.exports = class InteractionResponseMessage extends InteractionComponentResponse {

  reset() {
    super.reset();
    this.data = {
      ...this.data,
      type: InteractionResponseType.ChannelMessageWithSource,
      content: null,
      embeds: null,
      flags: 0,
      options: {
        emoji: '',
        color: Colours.blue,
        allowedMentions: { parse: ['users', 'roles'] }
      }
    };
  }

  _lastEmbed() {
    return (this.data.embeds || []).at(-1);
  }

  /**
   * Add an embed to the response
   * @param {object} embed
   * @param {boolean} [firstOnly = true] only add the embed if it's the first
   */
  addEmbed(embed = {}, firstOnly = true) {
    if (!this.data.embeds) {
      this.data.embeds = [];
    }

    if (firstOnly && !this.data.embeds[0]) {
      this.data.embeds.push(embed);
    }
    return this;
  }

  /**
   * Set the content of the response
   * @param {string} content
   * @param {object} [options]
   * @param {object} [options.stripIndents=true]
   * @returns {InteractionResponse}
   */
  setContent(content, options) {
    this.data.content = options?.stripIndents ? content.stripIndents() : content;
    return this;
  }

  /**
   * Set this response as ephemeral
   * @returns {InteractionResponse}
   */
  setEphemeral() {
    this.data.flags |= MessageFlags.Ephemeral;
    return this;
  }

  /**
   * Set the embed author
   * @param {string} name
   * @param {string?} icon
   * @returns {InteractionResponse}
   */
  setAuthor(name, icon) {
    this.addEmbed();
    this._lastEmbed().author = { name, icon_url: icon };
    return this;
  }

  /**
   * Set the embed title
   * @param {string} title
   * @returns {InteractionResponse}
   */
  setTitle(title) {
    this.addEmbed();
    this._lastEmbed().title = title;
    return this;
  }

  /**
   * Set the embed description
   * @param {string} description
   * @returns {InteractionResponse}
   */
  setDescription(description) {
    this.addEmbed();
    this._lastEmbed().description = description;
    return this;
  }

  /**
   * Add a field to the embed
   * @param field
   * @returns {InteractionResponseMessage}
   */
  addField(name, value, inline = false) {
    this.addEmbed();
    if (!this._lastEmbed().fields) {
      this._lastEmbed().fields = [];
    }
    this._lastEmbed().fields.push({ name, value, inline });
    return this;
  }

  /**
   * Set the embed footer
   * @param footer
   * @returns {InteractionResponse}
   */
  setFooter(footer) {
    this.addEmbed();
    this._lastEmbed().footer = { text: footer };
    return this;
  }

  /**
   * Set the embed image
   * @param url
   * @returns {InteractionResponse}
   */
  setImage(url) {
    this.addEmbed();
    this._lastEmbed().image = url ? { url } : undefined;
    return this;
  }

  /**
   * Set the embed thumbnail image
   * @param url
   * @returns {InteractionResponse}
   */
  setThumbnail(url) {
    this.addEmbed();
    this._lastEmbed().thumbnail = url ? { url } : undefined;
    return this;
  }

  /**
   * Set the emoji and embed color
   * @param {boolean} [state]
   * @param {object} [options]
   * @param {boolean|string} [options.emoji = true]
   */
  setSuccess(state, options = {}) {
    switch (state) {
      case true:
        if (options.emoji !== false) {
          this.data.options.emoji = `${Emojis.resolveEmoji(options.emoji) || Emojis.resolveEmoji('check')} `;
        }
        this.data.options.color = Colours.green;
        break;

      case false:
        if (options.emoji !== false) {
          this.data.options.emoji = `${Emojis.resolveEmoji(options.emoji) || Emojis.resolveEmoji('cross')} `;
        }
        this.data.options.color = Colours.red;
        break;
    }

    return this;
  }

  /**
   * Set the embed colour
   * @param {string} colour
   * @returns {InteractionResponse}
   */
  setColour(colour) {
    this.data.options.colour = Colours[colour];
    return this;
  }

  toJSON() {
    const result = {
      ...super.toJSON(),
      data: { allowed_mentions: this.data.options.allowedMentions }
    };

    if (this.data.flags) result.data.flags = this.data.flags;
    if (this.data.components?.length) result.data.components = this.data.components;
    if (this.data.components === 'NULL') result.data.components = [];

    if (this.data.content !== null) {
      if (this.data.content && !this.data.embeds?.[0]?.description) {
        //  include the emoji if content isn't an empty string & there's no embed description
        result.data.content = `${this.data.options.emoji}${this.data.content}`;
      } else {
        result.data.content = this.data.content;
      }
    }

    if (this.data.embeds?.length) {
      result.data.embeds = this.data.embeds
        .map(embed => {
          //  set the embed color
          embed.color = embed.color || this.data.options.color;

          //  set the embed description
          if (embed.description) {
            embed.description = `${this.data.options.emoji}${embed.description}`;
          }

          return embed;
        });
    }

    return result;
  }

};
