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

$(function () {
  $(document).on('selectionchange', selectionChanged);

  $('.editor button').click(function () {
    var command = $(this).data('state');
    document.execCommand(command, false, null);
  });

  $('[contenteditable=true').focus();
});
