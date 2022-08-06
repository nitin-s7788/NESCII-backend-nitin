'use strict';
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

function sanitizeContent(content) {
    const window = new JSDOM('').window;
    const DOMPurify = createDOMPurify(window);

    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
        if ('target' in node) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noreferrer noopener');
        }

        // set non-HTML/MathML links to xlink:show=new
        if (
            !node.hasAttribute('target') &&
            (node.hasAttribute('xlink:href') || node.hasAttribute('href'))
        ) {
            node.setAttribute('xlink:show', 'new');
        }
    });

    return DOMPurify.sanitize(content);
}

module.exports = {
    lifecycles: {
        beforeCreate(data) {
            data.Content = sanitizeContent(data.Content);
        },

        beforeUpdate(params, data) {
            data.Content = sanitizeContent(data.Content);
        }
    },
};