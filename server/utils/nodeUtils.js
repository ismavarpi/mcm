async function addTagsToDescendants(Node, parentId, tagIds) {
  const children = await Node.findAll({ where: { parentId } });
  for (const child of children) {
    const currentTags = await child.getTags();
    const currentIds = currentTags.map(t => t.id);
    const newIds = Array.from(new Set([...currentIds, ...tagIds]));
    await child.setTags(newIds);
    await addTagsToDescendants(Node, child.id, tagIds);
  }
}

async function removeTagsFromDescendants(Node, parentId, tagIds) {
  const children = await Node.findAll({ where: { parentId } });
  for (const child of children) {
    const currentTags = await child.getTags();
    const currentIds = currentTags.map(t => t.id);
    const newIds = currentIds.filter(id => !tagIds.includes(id));
    await child.setTags(newIds);
    await removeTagsFromDescendants(Node, child.id, tagIds);
  }
}

async function computeNodeCode(Node, node) {
  let prefix = '';
  if (node.parentId) {
    const parent = await Node.findByPk(node.parentId);
    prefix = parent.code ? parent.code + '.' : '';
  }
  let part;
  if (node.codePattern === 'ORDER') {
    if (!node.order || node.order === 0) {
      const max = await Node.max('order', { where: { parentId: node.parentId, codePattern: 'ORDER' } });
      node.order = (max || 0) + 1;
    }
    part = String(node.order);
  } else {
    part = node.codePattern;
  }
  return prefix + part;
}

async function updateNodeAndDescendants(Node, node) {
  node.code = await computeNodeCode(Node, node);
  await node.save();
  const children = await Node.findAll({ where: { parentId: node.id } });
  for (const child of children) {
    await updateNodeAndDescendants(Node, child);
  }
}

async function recalculateSiblingOrders(Node, parentId) {
  const siblings = await Node.findAll({
    where: { parentId },
    order: [['order', 'ASC'], ['id', 'ASC']]
  });
  let current = 1;
  for (const sib of siblings) {
    sib.order = current++;
    if (sib.codePattern === 'ORDER') {
      await updateNodeAndDescendants(Node, sib);
    } else {
      await sib.save();
    }
  }
}

module.exports = {
  addTagsToDescendants,
  removeTagsFromDescendants,
  computeNodeCode,
  updateNodeAndDescendants,
  recalculateSiblingOrders,
};
