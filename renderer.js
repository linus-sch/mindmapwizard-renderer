
            function generateSVG(markdown) {
                const nodeSpacing = 35, levelSpacing = 120, maxNodeWidth = 400, lineHeight = 22;
                const fontSize = 16, charWidth = 9.5, horizontalPadding = 14, verticalPadding = 6;
                const colors = ['rgb(255, 127, 15)', 'rgb(0, 191, 191)', 'rgb(50, 205, 53)', 'rgb(206, 91, 255)', 'rgb(255, 191, 0)', 'rgb(255, 64, 129)', 'rgb(3, 169, 244)', 'rgb(255, 87, 34)', 'rgb(0, 183, 165)'];
                const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
                function buildHierarchy(lines) { const root = { text: 'Root', children: [], level: 0 }; let parentStack = [root]; let lastNode = null; lines.forEach(line => { const trimmedLine = line.trim(); if (!trimmedLine) return; const headingMatch = trimmedLine.match(/^(#+)\s*(.*)/); const bulletMatch = line.match(/^(\s*)-\s+(.*)/); let node = null; let level = 0; if (headingMatch) { level = headingMatch[1].length; node = { text: headingMatch[2].trim(), children: [], level, parent: null }; } else if (bulletMatch) { const indentation = bulletMatch[1].length; const parentLevel = parentStack[parentStack.length - 1].level; level = parentLevel + Math.floor(indentation / 2) + 1; node = { text: bulletMatch[2].trim(), children: [], level, parent: null }; } else if (lastNode) { lastNode.text += ` ${trimmedLine}`; return; } else { return; } while (parentStack[parentStack.length - 1].level >= level) { parentStack.pop(); } const parent = parentStack[parentStack.length - 1]; node.parent = parent; parent.children.push(node); parentStack.push(node); lastNode = node; }); return root; }
                function assignBranchColors(node) { function propagateColor(currentNode, color) { currentNode.branchColor = color; currentNode.children.forEach(child => propagateColor(child, color)); } if (node.level === 0) { const titleColor = shuffledColors[0 % shuffledColors.length]; const branchColors = shuffledColors.slice(1); node.children.forEach(level1Node => { level1Node.branchColor = titleColor; level1Node.children.forEach((level2Node, index) => { const uniqueBranchColor = branchColors[index % branchColors.length]; propagateColor(level2Node, uniqueBranchColor); }); }); } }
                function processNode(node) { if (!node.text || node.text.trim() === '') { node.textLines = []; node.rectWidth = 0; node.rectHeight = 0; } else { const words = node.text.split(/\s+/).filter(Boolean); const lines = []; let currentLine = ''; for (const word of words) { if (currentLine === '') { currentLine = word; } else { const testLine = `${currentLine} ${word}`; if ((testLine.length * charWidth) <= maxNodeWidth) { currentLine = testLine; } else { lines.push(currentLine); currentLine = word; } } } if (currentLine) { lines.push(currentLine); } node.textLines = lines.map(line => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')); const textWidth = Math.max(...node.textLines.map(l => l.length * charWidth), 0); const textHeight = node.textLines.length * lineHeight; node.rectWidth = textWidth + horizontalPadding * 2; node.rectHeight = textHeight + verticalPadding * 2; } node.children.forEach(processNode); }
                function assignPositions(node, startY = 0) { let currentY = startY; node.children.forEach(child => { assignPositions(child, currentY); const childrenHeight = child.totalSubtreeHeight || child.rectHeight; currentY += childrenHeight + nodeSpacing; }); node.totalSubtreeHeight = Math.max(node.rectHeight, currentY - startY - nodeSpacing); if (node.children.length > 0) { const firstChild = node.children[0]; const lastChild = node.children[node.children.length - 1]; node.y = (firstChild.y + lastChild.y) / 2; } else { node.y = startY + node.rectHeight / 2; } }
                function drawNodes(nodes, startX, parentY = 0, isTopLevel = false) {
                    let svg = '';
                    nodes.forEach((node) => {
                        if (!node.text) return;
                        const x = startX, y = node.y, branchColor = node.branchColor || '#03a9f4';
                        if (!isTopLevel) {
                            const parentX = startX - levelSpacing, curve = levelSpacing * 0.5;
                            svg += `<path class="markmap-link" d="M ${parentX},${parentY} C ${parentX + curve},${parentY} ${x - curve},${y} ${x},${y}" stroke="${branchColor}" stroke-width="1.5" fill="none" />`;
                        }
                        svg += `<g class="markmap-node" transform="translate(${x},${y - node.rectHeight / 2})"><rect x="0" y="0" width="${node.rectWidth}" height="${node.rectHeight}" rx="14" ry="14" fill="${branchColor}" opacity="0.2"></rect><foreignObject x="${horizontalPadding}" y="${verticalPadding}" width="${node.rectWidth - horizontalPadding * 2}" height="${node.rectHeight - verticalPadding * 2}"><div xmlns="http://www.w3.org/1999/xhtml" class="node-text" style="color: ${branchColor};">${node.textLines.join('<br/>')}</div></foreignObject></g>`;
                        if (node.children.length > 0) {
                            svg += drawNodes(node.children, x + node.rectWidth + levelSpacing, y);
                        }
                    });
                    return svg;
                }
                const lines = markdown.split('\n'); const hierarchy = buildHierarchy(lines); if (!hierarchy.children.length) return '';
                assignBranchColors(hierarchy); processNode(hierarchy); assignPositions(hierarchy);
                const totalHeight = hierarchy.totalSubtreeHeight + 100; const maxDepth = (node) => 1 + Math.max(0, ...node.children.map(maxDepth)); const depth = maxDepth(hierarchy); const totalWidth = depth * (maxNodeWidth + levelSpacing) + 200;
                const svgOutput = `<svg xmlns="http://www.w3.org/2000/svg"><g class="mindmap-content">${drawNodes(hierarchy.children, 0, hierarchy.y, true)}</g></svg>`;
                return svgOutput;
            }