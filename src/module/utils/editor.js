import {enrichHTMLUnrolled} from "./utils";

export function handlebarsBuildEditor(options) {
  const target = options.hash['target'];
  if ( !target ) throw new Error("You must define the name of a target field.");

  // Enrich the content
  let documents = options.hash.documents !== false;
  const owner = Boolean(options.hash['owner']);
  const rollData = options.hash["rollData"];
  const content = enrichHTMLUnrolled(options.hash['content'] || "", {rolls: false, secrets: owner, documents, rollData});

  // Construct the HTML
  let editor = $(`<div class="dl-editor"><div class="dl-editor-content" data-edit="${target}">${content}</div></div>`);
  return new Handlebars.SafeString(editor[0].outerHTML);
}


// ------------------------------------------------------------------------

export function initDlEditor(html, application) {
  // eslint-disable-next-line no-undef
  tinymce.init({
    selector: '.dl-editor-content',
    menubar: false,
    inline: true,
    plugins: [
      'autolink', 'autoresize', 'link', 'lists', 'table', 'quickbars', 'code'
    ],
    toolbar: false,
    quickbars_selection_toolbar: 'bold italic underline styleselect| customInsertButton roll blocks secrets | bullist numlist | blockquote',
    contextmenu: 'undo redo | inserttable bullist numlist | styles code',
    quickbars_insert_toolbar: false,
    powerpaste_word_import: 'clean',
    powerpaste_html_import: 'clean',
    min_height: 400,
    toolbar_mode: 'sliding',
    autoresize_bottom_margin: 50,

    setup: function (editor) {

      editor.ui.registry.addButton('customInsertButton', {
        text: 'Roll',
        // icon:

        onAction: function () {
          editor.focus();
          editor.selection.setContent(`[[/r ${editor.selection.getContent()}]]`);
        }
      });

      editor.ui.registry.addButton('secrets', {
        text: 'Secret',
        onAction: () => {
          editor.focus();
          console.log(editor.ui.registry.getAll())
          editor.selection.setContent(`<section class=secret>${editor.selection.getContent()}</section>`)
        }

      })

      var toTimeHtml = function (date) {
        return '<time datetime="' + date.toString() + '">' + date.toDateString() + '</time>';
      };

      editor.ui.registry.addButton('customDateButton', {
        icon: 'insert-time',
        tooltip: 'Insert Current Date',
        disabled: true,
        onAction: function (_) {
          editor.insertContent(toTimeHtml(new Date()));
        },
        onSetup: function (buttonApi) {
          var editorEventCallback = function (eventApi) {
            buttonApi.setDisabled(eventApi.element.nodeName.toLowerCase() === 'time');
          };
          editor.on('NodeChange', editorEventCallback);

          /* onSetup should always return the unbind handlers */
          // return function (buttonApi) {
          //   editor.off('NodeChange', editorEventCallback);
          // };
        }
      });
    },

  });

  html.find('.dl-editor-content[data-edit]').each((i, div) => {
    console.log(div)
    const editor = application.editors[name] = {
      target: name,
      button: undefined,
      hasButton: false,
      mce: null,
      active: true,
      changed: false,
      options: {},
      initial: foundry.utils.getProperty(application.object.data, name)
    };
    console.log(editor)
  })
}

// ------------------------------------------------------------------------
