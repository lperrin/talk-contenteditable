function getEditor() {
  return $('[contenteditable=true]');
}

// decide if the selected text is bold/italic/underlined
// whenever the selection changes
function selectionChanged() {
  var nodes = getSelectedNodes(),
      editorNode = getEditor();

  var state = {bold: false, italic: false, underline: false, fontSize: 12};

  if (nodes.length === 0)
    return;

  state.bold = nodes.every(function (node) {
    return nodeHasParent(node, 'B', editorNode);
  });

  state.italic = nodes.every(function (node) {
    return nodeHasParent(node, 'I', editorNode);
  });

  state.underline = nodes.every(function (node) {
    return nodeHasParent(node, 'U', editorNode);
  });

  $('.editor button[data-state=bold]').toggleClass('active', state.bold);
  $('.editor button[data-state=italic]').toggleClass('active', state.italic);
  $('.editor button[data-state=underline]').toggleClass('active', state.underline);
}

function nodeHasParent(node, style, root) {
  if (!node || node === root)
    return false;

  if (node.nodeName === style)
    return true;

  return nodeHasParent(node.parentNode, style, root);
}

function getSelectedNodes() {
  var nodes = getAllSelectedNodes(),
      editorNode = getEditor();

  // ignore if the user's selection is not in the editor
  var allInEditor = nodes.every(function (node) {
    return editorNode.find(node).length > 0;
  });

  return allInEditor ? nodes : [];
}

// http://stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
function getAllSelectedNodes() {
  if (!window.getSelection)
    return [];

  var sel = window.getSelection();

  if (sel.isCollapsed)
    return [sel.baseNode];
  else
    return getRangeSelectedNodes(sel.getRangeAt(0));
}

function getRangeSelectedNodes(range) {
  var node = range.startContainer;
  var endNode = range.endContainer;

  // Special case for a range that is contained within a single node
  if (node === endNode) {
    return [node];
  }

  // Iterate nodes until we hit the end container
  var rangeNodes = [];
  while (node && node !== endNode) {
    rangeNodes.push( node = nextNode(node) );
  }

  // Add partially selected nodes at the start of the range
  node = range.startContainer;
  while (node && node !== range.commonAncestorContainer) {
    rangeNodes.unshift(node);
    node = node.parentNode;
  }

  return rangeNodes;
}

function nextNode(node) {
  if (node.hasChildNodes()) {
    return node.firstChild;
  } else {
    while (node && !node.nextSibling) {
      node = node.parentNode;
    }
    if (!node) {
      return null;
    }
    return node.nextSibling;
  }
}

var fontSizes = {1: 10, 2: 12, 3: 14, 4: 18, 5: 24, 6: 32, 7: 48};

function forceFontSize(editor, size) {
  // execCommand inserts <font size="4"> which appears way too small in Safari
  // http://stackoverflow.com/questions/5868295/document-execcommand-fontsize-in-pixels
  var fontElements = document.getElementsByTagName('font'),
      targetSize = fontSizes[size] + 'px';

  size = size.toString();

  for (var i = 0, len = fontElements.length; i < len; ++i) {
    if (fontElements[i].size === size) {
      fontElements[i].removeAttribute('size');
      fontElements[i].style.fontSize = targetSize;
    }
  }
}

$(function () {
  $(document).on('selectionchange', selectionChanged);

  $('.editor button[data-state]').click(function () {
    var command = $(this).data('state');
    document.execCommand(command, false, null);
  });

  var fontSizes = {
    small: 1,
    medium: 3,
    large: 7
  };

  $('.editor button.change-font').click(function () {
    var rawSize = $(this).data('size'),
        size = fontSizes[rawSize];

    document.execCommand('fontSize', false, size);
    forceFontSize(getEditor(), size);
  });

  $('#prompt-url').on('show.bs.modal', function () {
    $(this).find('input').val('');
  });

  $('#prompt-url').on('shown.bs.modal', function () {
    $(this).find('input').focus();
  });

  $('#prompt-url button.btn-primary').click(function () {
    var url = $('#prompt-url input').val();

    if (url) {
      var link = '<a href="' + encodeURI(url) + '">' + url + '</a>';

      $('[contenteditable=true').focus();
      restoreSelection();
      document.execCommand('insertHTML', false, link);
    }
  });

  $('.editor [contenteditable=true').focus();

  var savedSelection = null;

  function saveSelection() {
    var sel = window.getSelection();

    if (sel.getRangeAt && sel.rangeCount)
      savedSelection = sel.getRangeAt(0);
  }

  function restoreSelection() {
    if (!savedSelection)
      return;

    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedSelection);
    savedSelection = null;
  }

  $('.toolbar button').on('mousedown', saveSelection);
});
