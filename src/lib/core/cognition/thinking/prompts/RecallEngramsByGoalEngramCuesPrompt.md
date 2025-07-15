# 召回的记忆

<% if (it.recalledEngrams && it.recalledEngrams.length > 0) { %>
<% it.recalledEngrams.forEach(engram => { %>
## <%= engram.content %>
- 强度: <%= engram.strength %>
- 类型: <%= engram.type %>
<% if (engram.schema) { %>
- 结构: <%= engram.schema.replace(/\n/g, ' → ') %>
<% } %>

<% }) %>
<% } else { %>
无相关记忆。
<% } %>