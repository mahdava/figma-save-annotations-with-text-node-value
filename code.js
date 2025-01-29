//console.log("Plugin starting: Text Annotations Viewer");

// Show the UI with specified dimensions
figma.showUI(__html__, { width: 400, height: 600 });
//console.log("UI is displayed.");

// Initial update on plugin launch
updateUIForCurrentSelection();

figma.on("selectionchange", () => {
  //console.log("Selection changed, updating UI...");
  updateUIForCurrentSelection();
});

function updateUIForCurrentSelection() {
  //console.log("updateUIForCurrentSelection() triggered.");

  const selection = figma.currentPage.selection;

  // keep it somewhat graceful
  if (selection.length === 0) {
    //console.log("No nodes selected.");
    figma.ui.postMessage({
      type: "NO_SELECTION",
      message:
        "No node selected. Please select a node containing text elements with annotations.",
    });
    return;
  }

  const selectedNode = selection[0];
  const annotationsData = gatherAnnotationsFromNode(selectedNode);

  if (annotationsData.length === 0) {
    console.log("No annotations found in the selected node.");
    figma.ui.postMessage({
      type: "NO_ANNOTATIONS",
      message: "No annotations found in the selected element.",
    });
    return;
  }

  // pass to the "ui" file
  figma.ui.postMessage({
    type: "ANNOTATIONS_FOUND",
    data: annotationsData,
    nodeName: selectedNode.name,
    message: `Annotations found in the selected node "${selectedNode.name}".`,
  });
}

/**
 * Gathers annotations from all text nodes within the given node.
 * Extracts only the 'label' property from each annotation.
 * @param {BaseNode} node - The selected node.
 * @returns {Array} - An array of objects containing annotation label and text.
 */
function gatherAnnotationsFromNode(node) {
  const annotations = [];

  // If the selected node is a TEXT node, well that's it
  // otherwise find all TEXT nodes within the selected element
  let searchScope = [];
  if (node.type === "TEXT") {
    searchScope = [node];
  } else if (typeof node.findAll === "function") {
    searchScope = node.findAll((n) => n.type === "TEXT");
  } else {
    return annotations;
  }

  // console.log(
  //   `Found ${searchScope.length} text node(s) in the selected node "${node.name}".`
  // );

  for (const textNode of searchScope) {
    // Access annotations attached to the text node
    const nodeAnnotations = textNode.annotations || [];

    // console.log(
    //   `Text node "${textNode.name}" has ${nodeAnnotations.length} annotation(s).`
    // );

    if (nodeAnnotations.length > 0) {
      for (const annotation of nodeAnnotations) {
        //console.log("Annotation Object:", annotation);

        const annotationLabel = annotation.label || "No Label";

        annotations.push({
          annotation: annotationLabel,
          text: textNode.characters,
        });

        //console.log(`Annotation added: "${annotationLabel}"`);
      }
    }
  }

  //console.log(`Total annotations collected: ${annotations.length}`);
  return annotations;
}
