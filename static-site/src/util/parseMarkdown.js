import marked from "marked";
import sanitizeHtml from 'sanitize-html';

// All of these tags may not be necessary, this list was adopted from https://github.com/nextstrain/auspice/blob/master/src/util/parseMarkdown.js
const allowedTags = ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'del', 'ol', 'ul', 'li', 'a', 'img'];
allowedTags.push('#text', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'th', 'tr', 'td', 'sub', 'sup');
// We want to support SVG elements, requiring the following tags (we exclude "foreignObject", "style" and "script")
allowedTags.push("svg", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform");
allowedTags.push("circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer");
allowedTags.push("feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA");
allowedTags.push("feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset");
allowedTags.push("fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font-face");
allowedTags.push("font-face-format", "font-face-name", "font-face-src", "font-face-uri", "g", "glyph", "glyphRef");
allowedTags.push("hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing-glyph", "mpath", "path");
allowedTags.push("pattern", "polygon", "polyline", "radialGradient", "rect", "set", "stop", "switch", "symbol");
allowedTags.push("text", "textPath", "title", "tref", "tspan", "use", "view", "vkern");

const allowedAttributes = ['href', 'src', 'width', 'height', 'alt'];
// We add the following Attributes for SVG via https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute
// Certain values have been excluded here, e.g. "style"
allowedAttributes.push("accent-height", "accumulate", "additive", "alignment-baseline", "allowReorder", "alphabetic", "amplitude", "arabic-form", "ascent", "attributeName", "attributeType", "autoReverse", "azimuth");
allowedAttributes.push("baseFrequency", "baseline-shift", "baseProfile", "bbox", "begin", "bias", "by");
allowedAttributes.push("calcMode", "cap-height", "class", "clip", "clipPathUnits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cursor", "cx", "cy");
allowedAttributes.push("d", "decelerate", "descent", "diffuseConstant", "direction", "display", "divisor", "dominant-baseline", "dur", "dx", "dy");
allowedAttributes.push("edgeMode", "elevation", "enable-background", "end", "exponent", "externalResourcesRequired");
allowedAttributes.push("fill", "fill-opacity", "fill-rule", "filter", "filterRes", "filterUnits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "format", "from", "fr", "fx", "fy");
allowedAttributes.push("g1", "g2", "glyph-name", "glyph-orientation-horizontal", "glyph-orientation-vertical", "glyphRef", "gradientTransform", "gradientUnits");
allowedAttributes.push("hanging", "height", "href", "hreflang", "horiz-adv-x", "horiz-origin-x");
allowedAttributes.push("id", "ideographic", "image-rendering", "in", "in2", "intercept");
allowedAttributes.push("k", "k1", "k2", "k3", "k4", "kernelMatrix", "kernelUnitLength", "kerning", "keyPoints", "keySplines", "keyTimes");
allowedAttributes.push("lang", "lengthAdjust", "letter-spacing", "lighting-color", "limitingConeAngle", "local");
allowedAttributes.push("marker-end", "marker-mid", "marker-start", "markerHeight", "markerUnits", "markerWidth", "mask", "maskContentUnits", "maskUnits", "mathematical", "max", "media", "method", "min", "mode");
allowedAttributes.push("name", "numOctaves");
allowedAttributes.push("offset", "opacity", "operator", "order", "orient", "orientation", "origin", "overflow", "overline-position", "overline-thickness");
allowedAttributes.push("panose-1", "paint-order", "path", "pathLength", "patternContentUnits", "patternTransform", "patternUnits", "ping", "pointer-events", "points", "pointsAtX", "pointsAtY", "pointsAtZ", "preserveAlpha", "preserveAspectRatio", "primitiveUnits");
allowedAttributes.push("r", "radius", "referrerPolicy", "refX", "refY", "rel", "rendering-intent", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "restart", "result", "rotate", "rx", "ry");
allowedAttributes.push("scale", "seed", "shape-rendering", "slope", "spacing", "specularConstant", "specularExponent", "speed", "spreadMethod", "startOffset", "stdDeviation", "stemh", "stemv", "stitchTiles", "stop-color", "stop-opacity", "strikethrough-position", "strikethrough-thickness", "string", "stroke", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width", "surfaceScale", "systemLanguage");
allowedAttributes.push("tabindex", "tableValues", "target", "targetX", "targetY", "text-anchor", "text-decoration", "text-rendering", "textLength", "to", "transform", "type");
allowedAttributes.push("u1", "u2", "underline-position", "underline-thickness", "unicode", "unicode-bidi", "unicode-range", "units-per-em");
allowedAttributes.push("v-alphabetic", "v-hanging", "v-ideographic", "v-mathematical", "values", "vector-effect", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "viewBox", "viewTarget", "visibility");
allowedAttributes.push("width", "widths", "word-spacing", "writing-mode");
allowedAttributes.push("x", "x-height", "x1", "x2", "xChannelSelector");
allowedAttributes.push("y", "y1", "y2", "yChannelSelector");
allowedAttributes.push("z", "zoomAndPan");

export const parseMarkdown = (mdString) => {
  const sanitizerConfig = {
    allowedTags,
    allowedAttributes: {"*": allowedAttributes},
    // These two config settings come from https://github.com/cure53/DOMPurify
    // and it's not clear how to set them in https://github.com/apostrophecms/sanitize-html
    // which we are using here.
    // KEEP_CONTENT: false,
    // ALLOW_DATA_ATTR: false
  };
  const rawDescription = marked(mdString);
  const cleanDescription = sanitizeHtml(rawDescription, sanitizerConfig);
  return cleanDescription;
};
