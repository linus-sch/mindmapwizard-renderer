function generateSVG(markdown) {
    const nodeSpacing = 35;
    const levelSpacing = 120;
    const maxNodeWidth = 400;
    const lineHeight = 22;
    const fontSize = 16;
    const charWidth = 9.5;
    const horizontalPadding = 14;
    const verticalPadding = 6;
    const horizontalMargin = 60;
    const verticalMargin = 60;
    const palette = [
        'rgb(255, 127, 15)',
        'rgb(0, 191, 191)',
        'rgb(50, 205, 53)',
        'rgb(206, 91, 255)',
        'rgb(255, 191, 0)',
        'rgb(255, 64, 129)',
        'rgb(3, 169, 244)',
        'rgb(255, 87, 34)',
        'rgb(0, 183, 165)'
    ];
    const defaultBranchColor = '#03a9f4';

    function escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildHierarchy(lines) {
        const root = { text: 'Root', children: [], level: 0 };
        const parentStack = [root];
        let lastNode = null;

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const headingMatch = trimmedLine.match(/^(#+)\s*(.*)/);
            const bulletMatch = line.match(/^(\s*)-\s+(.*)/);
            let node = null;
            let level = 0;

            if (headingMatch) {
                level = headingMatch[1].length;
                node = { text: headingMatch[2].trim(), children: [], level, parent: null };
            } else if (bulletMatch) {
                const indentation = bulletMatch[1].length;
                const parentLevel = parentStack[parentStack.length - 1].level;
                level = parentLevel + Math.floor(indentation / 2) + 1;
                node = { text: bulletMatch[2].trim(), children: [], level, parent: null };
            } else if (lastNode) {
                lastNode.text += ` ${trimmedLine}`;
                return;
            } else {
                return;
            }

            while (parentStack.length && parentStack[parentStack.length - 1].level >= level) {
                parentStack.pop();
            }

            const parent = parentStack[parentStack.length - 1];
            node.parent = parent;
            node.text = node.text.trim();
            parent.children.push(node);
            parentStack.push(node);
            lastNode = node;
        });

        return root;
    }

    function assignBranchColors(node) {
        function propagateColor(currentNode, color) {
            currentNode.branchColor = color;
            currentNode.children.forEach(child => propagateColor(child, color));
        }

        if (node.level === 0) {
            const shuffledColors = [...palette].sort(() => Math.random() - 0.5);
            const titleColor = shuffledColors[0 % shuffledColors.length];
            const branchColors = shuffledColors.slice(1);
            node.children.forEach(level1Node => {
                level1Node.branchColor = titleColor;
                level1Node.children.forEach((level2Node, index) => {
                    const uniqueBranchColor = branchColors[index % branchColors.length];
                    propagateColor(level2Node, uniqueBranchColor);
                });
            });
        }
    }

    function processNode(node) {
        if (!node.text || node.text.trim() === '') {
            node.textLines = [];
            node.rectWidth = 0;
            node.rectHeight = 0;
        } else {
            const words = node.text.split(/\s+/).filter(Boolean);
            const wrappedLines = [];
            let currentLine = '';

            for (const word of words) {
                if (currentLine === '') {
                    currentLine = word;
                    continue;
                }
                const testLine = `${currentLine} ${word}`;
                if ((testLine.length * charWidth) <= maxNodeWidth) {
                    currentLine = testLine;
                } else {
                    wrappedLines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) wrappedLines.push(currentLine);

            const textWidth = wrappedLines.reduce(
                (max, line) => Math.max(max, line.length * charWidth),
                0
            );
            const textHeight = wrappedLines.length * lineHeight;

            node.textLines = wrappedLines.map(escapeXml);
            node.rectWidth = textWidth + horizontalPadding * 2;
            node.rectHeight = textHeight + verticalPadding * 2;
        }

        node.children.forEach(processNode);
    }

    function assignPositions(node, startY = 0) {
        let currentY = startY;

        node.children.forEach((child) => {
            assignPositions(child, currentY);
            const childrenHeight = child.totalSubtreeHeight || child.rectHeight;
            currentY += childrenHeight + nodeSpacing;
        });

        node.totalSubtreeHeight = Math.max(node.rectHeight || 0, currentY - startY - nodeSpacing);

        if (node.children.length > 0) {
            const firstChild = node.children[0];
            const lastChild = node.children[node.children.length - 1];
            node.y = (firstChild.y + lastChild.y) / 2;
        } else {
            node.y = startY + (node.rectHeight || 0) / 2;
        }
    }

    function assignXPositions(node, x) {
        node.x = x;
        const nextX = x + node.rectWidth + levelSpacing;
        node.children.forEach((child) => assignXPositions(child, nextX));
    }

    function createExtents() {
        return {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity
        };
    }

    function getBezierBounds(x0, y0, x1, y1, x2, y2, x3, y3) {
        let xs = [x0, x3];
        let a = x0, b = x1, c = x2, d = x3;
        let p = b - a, q = c - b, r = d - c;
        let A = p - 2 * q + r;
        let B = 2 * q - 2 * p;
        let C = p;

        if (Math.abs(A) > 1e-6) {
            let disc = B * B - 4 * A * C;
            if (disc >= 0) {
                let sqrtD = Math.sqrt(disc);
                let t1 = (-B - sqrtD) / (2 * A);
                let t2 = (-B + sqrtD) / (2 * A);
                if (t1 > 0 && t1 < 1) {
                    let x = Math.pow(1 - t1, 3) * a + 3 * Math.pow(1 - t1, 2) * t1 * b + 3 * (1 - t1) * t1 * t1 * c + t1 * t1 * t1 * d;
                    xs.push(x);
                }
                if (t2 > 0 && t2 < 1) {
                    let x = Math.pow(1 - t2, 3) * a + 3 * Math.pow(1 - t2, 2) * t2 * b + 3 * (1 - t2) * t2 * t2 * c + t2 * t2 * t2 * d;
                    xs.push(x);
                }
            }
        } else if (Math.abs(B) > 1e-6) {
            let t = -C / B;
            if (t > 0 && t < 1) {
                let x = Math.pow(1 - t, 3) * a + 3 * Math.pow(1 - t, 2) * t * b + 3 * (1 - t) * t * t * c + t * t * t * d;
                xs.push(x);
            }
        }

        let minX = Math.min(...xs);
        let maxX = Math.max(...xs);
        let minY = Math.min(y0, y3);
        let maxY = Math.max(y0, y3);

        return { minX, maxX, minY, maxY };
    }

    function collectExtents(node, extents) {
        if (node.textLines && node.textLines.length) {
            const left = node.x;
            const right = node.x + node.rectWidth;
            const top = node.y - node.rectHeight / 2;
            const bottom = node.y + node.rectHeight / 2;

            extents.minX = Math.min(extents.minX, left);
            extents.maxX = Math.max(extents.maxX, right);
            extents.minY = Math.min(extents.minY, top);
            extents.maxY = Math.max(extents.maxY, bottom);
        }

        node.children.forEach((child) => {
            if (
                typeof node.x === 'number' &&
                typeof node.y === 'number' &&
                typeof child.x === 'number' &&
                typeof child.y === 'number'
            ) {
                const startX = node.x + (node.rectWidth || 0);
                const startY = node.y;
                const endX = child.x;
                const endY = child.y;
                const curve = levelSpacing * 0.5;
                const control1X = startX + curve;
                const control1Y = startY;
                const control2X = endX - curve;
                const control2Y = endY;

                const bounds = getBezierBounds(startX, startY, control1X, control1Y, control2X, control2Y, endX, endY);
                extents.minX = Math.min(extents.minX, bounds.minX);
                extents.maxX = Math.max(extents.maxX, bounds.maxX);
                extents.minY = Math.min(extents.minY, bounds.minY);
                extents.maxY = Math.max(extents.maxY, bounds.maxY);
            }
            collectExtents(child, extents);
        });
    }

    function shiftCoordinates(node, offsetX, offsetY) {
        if (typeof node.x === 'number') node.x += offsetX;
        if (typeof node.y === 'number') node.y += offsetY;
        node.children.forEach((child) => shiftCoordinates(child, offsetX, offsetY));
    }

    function drawNode(node, parent) {
        let svg = '';
        const branchColor = node.branchColor || defaultBranchColor;

        if (
            parent &&
            parent.textLines &&
            parent.textLines.length &&
            typeof parent.x === 'number' &&
            typeof parent.y === 'number' &&
            typeof node.x === 'number' &&
            typeof node.y === 'number'
        ) {
            const startX = parent.x + (parent.rectWidth || 0);
            const startY = parent.y;
            const endX = node.x;
            const endY = node.y;
            const curve = levelSpacing * 0.5;
            const control1X = startX + curve;
            const control2X = endX - curve;

            svg += `<path class="mm-link" d="M ${startX},${startY} C ${control1X},${startY} ${control2X},${endY} ${endX},${endY}" stroke="${branchColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
        }

        if (node.textLines && node.textLines.length) {
            svg += `<g class="mm-node" transform="translate(${node.x},${node.y - node.rectHeight / 2})">`;
            svg += `<rect x="0" y="0" width="${node.rectWidth}" height="${node.rectHeight}" rx="14" ry="14" fill="${branchColor}" fill-opacity="0.18" stroke="none"/>`;
            const textAnchor = node.rectWidth <= 150 ? 'middle' : 'start';
            const textX = node.rectWidth <= 150 ? node.rectWidth / 2 : horizontalPadding;
            svg += `<text x="${textX}" y="${verticalPadding + fontSize}" font-family="Inter, 'Segoe UI', sans-serif" font-size="${fontSize}" fill="${branchColor}" text-anchor="${textAnchor}">`;
            node.textLines.forEach((line, index) => {
                if (index === 0) {
                    svg += `<tspan x="${textX}">${line}</tspan>`;
                } else {
                    svg += `<tspan x="${textX}" dy="${lineHeight}">${line}</tspan>`;
                }
            });
            svg += `</text></g>`;
        }

        node.children.forEach((child) => {
            svg += drawNode(child, node);
        });

        return svg;
    }

    const lines = markdown.split(/\r?\n/);
    const hierarchy = buildHierarchy(lines);
    if (!hierarchy.children.length) return '';

    assignBranchColors(hierarchy);
    processNode(hierarchy);

    hierarchy.textLines = [];
    hierarchy.rectWidth = 0;
    hierarchy.rectHeight = 0;

    assignPositions(hierarchy);
    assignXPositions(hierarchy, 0);

    let extents = createExtents();
    collectExtents(hierarchy, extents);
    if (!Number.isFinite(extents.minX) || !Number.isFinite(extents.minY)) {
        return '';
    }

    const offsetX = -extents.minX;
    const offsetY = -extents.minY;
    if (offsetX !== 0 || offsetY !== 0) {
        shiftCoordinates(hierarchy, offsetX, offsetY);
    }

    extents = createExtents();
    collectExtents(hierarchy, extents);

    const finalWidth = extents.maxX - extents.minX;
    const finalHeight = extents.maxY - extents.minY;

    const svgContent = hierarchy.children.map((child) => drawNode(child, hierarchy)).join('');

    const svgOutput = [
        `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${finalWidth} ${finalHeight}">`,
        '  <defs>',
        '    <style>',
        `      .mm-node text{font-family:"Inter","Segoe UI",sans-serif;font-size:${fontSize}px;line-height:1.4;}`,
        '    </style>',
        '  </defs>',
        svgContent,
        '</svg>'
    ].join('\n');

    return svgOutput;
}
