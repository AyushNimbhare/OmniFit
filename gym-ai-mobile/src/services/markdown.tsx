import React from 'react';
import { Text, View } from 'react-native';

/**
 * Lightweight helper to parse simple Markdown strings (headers, bullets, bold text)
 * and return styled React Native Text components.
 */
export function parseMarkdown(text: string, baseStyle: any = {}, boldStyle: any = {}) {
  if (!text) return null;

  // Split text by lines
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    let currentLine = line;

    // Check if the line is a header (e.g. ### Header)
    let isHeader = false;
    let headerLevel = 0;
    if (currentLine.startsWith('#')) {
      const match = currentLine.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        headerLevel = match[1].length;
        currentLine = match[2];
        isHeader = true;
      }
    }

    // Check if the line is a bullet point (e.g. * Item or - Item)
    let isBullet = false;
    if (currentLine.trim().startsWith('* ') || currentLine.trim().startsWith('- ')) {
      const match = currentLine.trim().match(/^[*|-]\s+(.*)$/);
      if (match) {
        currentLine = match[1];
        isBullet = true;
      }
    }

    // Parse bold segments (**bold**) inline
    const parts = [];
    let remaining = currentLine;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(remaining)) !== null) {
      const plainText = remaining.substring(lastIndex, match.index);
      const boldText = match[1];
      
      if (plainText) {
        parts.push(<Text key={`plain-${match.index}`}>{plainText}</Text>);
      }
      parts.push(
        <Text key={`bold-${match.index}`} style={[{ fontWeight: 'bold' }, boldStyle]}>
          {boldText}
        </Text>
      );
      
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < remaining.length) {
      parts.push(<Text key={`plain-end`}>{remaining.substring(lastIndex)}</Text>);
    }

    // Determine line formatting style
    let lineStyle: any = [baseStyle];
    if (isHeader) {
      lineStyle.push({
        fontSize: headerLevel === 1 ? 22 : headerLevel === 2 ? 18 : 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        color: '#FFFFFF'
      });
    }

    if (isBullet) {
      return (
        <View key={lineIdx} style={{ flexDirection: 'row', paddingLeft: 12, marginVertical: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Text style={[baseStyle, { marginRight: 6 }]}>•</Text>
          <Text style={lineStyle}>{parts}</Text>
        </View>
      );
    }

    // Return regular line text
    return (
      <Text key={lineIdx} style={[lineStyle, { marginVertical: 3 }]}>
        {parts}
      </Text>
    );
  });
}
