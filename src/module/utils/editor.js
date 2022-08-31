import {enrichHTMLUnrolled} from "./utils";

// ------------------------------------------------------------------------

export function handlebarsBuildEditor(options) {
  const target = options.hash['target'];
  if (!target) throw new Error("You must define the name of a target field.");

  // Enrich the content
  let documents = options.hash.documents !== false;
  const owner = Boolean(options.hash['owner']);
  const rollData = options.hash["rollData"];
  const content = enrichHTMLUnrolled(options.hash['content'] || "", {
    rolls: false,
    secrets: owner,
    documents,
    rollData
  });

  // Construct the HTML
  let editor = $(`<div class="dl-editor"><div class="dl-editor-toolbar"></div><div class="dl-editor-content" data-edit="${target}">${content}</div></div>`);
  return new Handlebars.SafeString(editor[0].outerHTML);
}


// ------------------------------------------------------------------------

export function initDlEditor(html, application) {
  $(function () {
    // eslint-disable-next-line no-undef
    tinymce.init({
      selector: '.dl-editor-content',
      menubar: false,
      inline: true,
      plugins: [
        'autolink', 'autoresize', 'link', 'lists', 'table', 'quickbars', 'code'
      ],
      toolbar: false,
      // fixed_toolbar_container: '.dl-editor-toolbar',
      quickbars_selection_toolbar: 'bold italic underline styleselect| customInsertButton roll blocks secrets | bullist numlist | blockquote',
      quickbars_insert_toolbar: 'styleselect',
      contextmenu: 'undo redo | inserttable bullist numlist | styles code',
      // quickbars_insert_toolbar: true,
      powerpaste_word_import: 'clean',
      powerpaste_html_import: 'clean',
      // min_height: 400,
      autoresize_bottom_margin: 50,

      setup: function (editor) {
        // Register the editor to the application
        const id = editor.id
        const edName = $(`#${id}`).closest('[data-edit]').data('edit')
        application.editors[edName] = {
          target: edName,
          button: undefined,
          hasButton: false,
          mce: editor,
          active: true,
          changed: false,
          options: {},
          initial: foundry.utils.getProperty(application.object.data, edName)
        };

        // Roll utility
        const currentSelectionRoll = () => {
          editor.focus()
          editor.selection.setContent(`[[/r ${editor.selection.getContent()}]]`)
        }

        editor.addShortcut('ctrl+r', 'Make Roll', currentSelectionRoll)
        editor.ui.registry.addButton('customInsertButton', {
          text: 'Roll',
          // icon:
          onAction: currentSelectionRoll
        });

        // Secret utility
        editor.ui.registry.addButton('secrets', {
          text: 'Secret',
          onAction: () => {
            editor.focus();
            editor.selection.setContent(`<section class=secret>${editor.selection.getContent()}</section>`)
          }
        })

        // Save on focusout
        editor.on('focusout', (ev) => {
          if (!ev.relatedTarget) application.saveEditor(edName).then(_ => application.render())
        })
      },
    })
  });

  // html.find('.dl-editor-content[data-edit]').each((i, div) => {
  //   const edName = $(div).closest('[data-edit]').data('edit')
  //   application.editors[edName] = {
  //     target: edName,
  //     button: undefined,
  //     hasButton: false,
  //     mce: null,
  //     active: true,
  //     changed: false,
  //     options: {},
  //     initial: foundry.utils.getProperty(application.object.data, edName)
  //   };
  // })
}

// ------------------------------------------------------------------------

// Weird fix for tinyMCE 5 error
const tinymceBind = window.tinymce.DOM.bind;
window.tinymce.DOM.bind = (target, _name, func, scope) => {
  // TODO This is only necessary until https://github.com/tinymce/tinymce/issues/4355 is fixed
  if (_name === 'mouseup' && func.toString().includes('throttle()')) {
    return func;
  } else {
    return tinymceBind(target, _name, func, scope);
  }
};

// ------------------------------------------------------------------------
