(() => {
  "use strict";

  const root = document.querySelector("[data-java-graph-root]");
  if (!root) {
    return;
  }

  const configEl = document.getElementById("java-graph-config");
  let config = {};
  if (configEl) {
    try {
      config = JSON.parse(configEl.textContent || "{}");
    } catch (error) {
      config = {};
    }
  }

  const statusEl = document.getElementById("java-graph-status");
  const hoverEl = document.getElementById("java-graph-hover");
  const fallbackEl = document.getElementById("java-graph-fallback");
  const canvasEl = document.getElementById("java-graph-canvas");

  const inspectorTitleEl = document.getElementById("java-graph-inspector-title");
  const inspectorMetaEl = document.getElementById("java-graph-inspector-meta");
  const inspectorSummaryEl = document.getElementById("java-graph-inspector-summary");
  const inspectorLinkEl = document.getElementById("java-graph-open-link");
  const relatedListEl = document.getElementById("java-graph-related-list");

  const searchEl = document.getElementById("java-graph-search");
  const topicFilterEl = document.getElementById("java-graph-topic-filter");
  const dayMinEl = document.getElementById("java-graph-day-min");
  const dayMaxEl = document.getElementById("java-graph-day-max");
  const dayMinValueEl = document.getElementById("java-graph-day-min-value");
  const dayMaxValueEl = document.getElementById("java-graph-day-max-value");
  const edgeTypeEls = Array.from(document.querySelectorAll(".java-graph-edge-type"));
  const clusterToggleEl = document.getElementById("java-graph-cluster-toggle");
  const layoutRefreshEl = document.getElementById("java-graph-layout-refresh");
  const resetEl = document.getElementById("java-graph-reset");

  if (!canvasEl || typeof cytoscape === "undefined") {
    if (statusEl) {
      statusEl.textContent = "Graph engine unavailable. Showing fallback list.";
    }
    return;
  }

  const state = {
    search: "",
    topic: "all",
    dayMin: 1,
    dayMax: 100,
    edgeTypes: new Set(["sequence", "reference", "topic"]),
    collapsed: false
  };

  const topicPalette = [
    "#58e5ff",
    "#79f5b0",
    "#ffd37a",
    "#b89cff",
    "#ff8ec5",
    "#9fe7ff",
    "#ffc38e",
    "#8bf0d9"
  ];

  let model = null;
  let cy = null;
  let expandedElements = null;
  const adjacency = new Map();

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const topicKey = (value) => `topic::${String(value || "Core Java").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const setStatus = (message) => {
    if (statusEl) {
      statusEl.textContent = message;
    }
  };

  const buildTopicColors = (topics) => {
    const map = new Map();
    topics.forEach((topic, index) => {
      map.set(topic, topicPalette[index % topicPalette.length]);
    });
    return map;
  };

  const addAdjacency = (source, target, type) => {
    if (!adjacency.has(source)) {
      adjacency.set(source, []);
    }
    adjacency.get(source).push({ target, type });
  };

  const normalizeModel = (raw) => {
    const nodes = Array.isArray(raw.nodes) ? raw.nodes : [];
    const edges = Array.isArray(raw.edges) ? raw.edges : [];

    const normalizedNodes = nodes.map((node) => ({
      id: String(node.id || ""),
      title: String(node.title || "Untitled"),
      url: String(node.url || ""),
      day: Number(node.day || 0),
      date: String(node.date || ""),
      topic: String(node.topic || "Core Java"),
      categories: Array.isArray(node.categories) ? node.categories.map((item) => String(item)) : [],
      summary: String(node.summary || "No summary available."),
      importance: Number(node.importance || 1)
    })).filter((node) => node.id);

    const nodeById = new Map(normalizedNodes.map((node) => [node.id, node]));

    const normalizedEdges = edges.map((edge) => ({
      id: String(edge.id || `${edge.source}-${edge.target}-${edge.type}`),
      source: String(edge.source || ""),
      target: String(edge.target || ""),
      type: String(edge.type || "reference"),
      weight: Number(edge.weight || 1),
      label: String(edge.label || edge.type || "reference")
    })).filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target) && edge.source !== edge.target);

    const degree = new Map();
    normalizedEdges.forEach((edge) => {
      degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
      addAdjacency(edge.source, edge.target, edge.type);
      addAdjacency(edge.target, edge.source, edge.type);
    });

    normalizedNodes.forEach((node) => {
      const inferredImportance = clamp(1 + ((degree.get(node.id) || 0) * 0.35), 1, 10);
      node.importance = clamp(Math.max(node.importance, inferredImportance), 1, 10);
    });

    const topics = [...new Set(normalizedNodes.map((node) => node.topic))].sort((a, b) => a.localeCompare(b));
    const topicColors = buildTopicColors(topics);

    normalizedNodes.forEach((node) => {
      node.color = topicColors.get(node.topic) || "#58e5ff";
    });

    const dayValues = normalizedNodes.map((node) => node.day).filter((day) => day > 0);
    const minDay = dayValues.length > 0 ? Math.min(...dayValues) : 1;
    const maxDay = dayValues.length > 0 ? Math.max(...dayValues) : 100;

    return {
      nodes: normalizedNodes,
      edges: normalizedEdges,
      topics,
      nodeById,
      topicColors,
      minDay,
      maxDay,
      meta: raw.meta || {}
    };
  };

  const buildExpandedElements = () => ({
    nodes: model.nodes.map((node) => ({
      data: {
        id: node.id,
        kind: "post",
        title: node.title,
        label: node.day > 0 ? `Day ${node.day}` : node.title,
        fullLabel: node.title,
        url: node.url,
        day: node.day,
        date: node.date,
        topic: node.topic,
        summary: node.summary,
        categories: node.categories,
        color: node.color,
        importance: node.importance
      }
    })),
    edges: model.edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        weight: edge.weight,
        label: edge.label
      }
    }))
  });

  const buildCollapsedElements = () => {
    const visibleTopics = new Map();

    model.nodes.forEach((node) => {
      const key = topicKey(node.topic);
      if (!visibleTopics.has(key)) {
        visibleTopics.set(key, {
          id: key,
          topic: node.topic,
          count: 0,
          color: node.color
        });
      }
      visibleTopics.get(key).count += 1;
    });

    const bridgeMap = new Map();
    model.edges.forEach((edge) => {
      if (!state.edgeTypes.has(edge.type)) {
        return;
      }
      const sourceNode = model.nodeById.get(edge.source);
      const targetNode = model.nodeById.get(edge.target);
      if (!sourceNode || !targetNode) {
        return;
      }
      const sourceTopic = topicKey(sourceNode.topic);
      const targetTopic = topicKey(targetNode.topic);
      if (sourceTopic === targetTopic) {
        return;
      }
      const ordered = [sourceTopic, targetTopic].sort();
      const bridgeKey = `${ordered[0]}::${ordered[1]}`;
      bridgeMap.set(bridgeKey, (bridgeMap.get(bridgeKey) || 0) + 1);
    });

    const nodes = [...visibleTopics.values()].map((topicNode) => ({
      data: {
        id: topicNode.id,
        kind: "topic-hub",
        topic: topicNode.topic,
        label: `${topicNode.topic} (${topicNode.count})`,
        summary: `${topicNode.count} posts`,
        count: topicNode.count,
        color: topicNode.color,
        importance: clamp(2 + topicNode.count * 0.2, 2, 12)
      }
    }));

    const edges = [...bridgeMap.entries()].map(([bridgeKey, weight], index) => {
      const [source, target] = bridgeKey.split("::");
      return {
        data: {
          id: `bridge-${index}`,
          source,
          target,
          type: "topic-bridge",
          label: "Cross-topic",
          weight
        }
      };
    });

    return { nodes, edges };
  };

  const createCy = (elements) => {
    if (cy) {
      cy.destroy();
    }

    cy = cytoscape({
      container: canvasEl,
      elements,
      wheelSensitivity: 0.18,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            color: "#e9f8ff",
            "font-family": "Space Grotesk",
            "font-size": 10,
            "font-weight": 600,
            "text-wrap": "wrap",
            "text-max-width": 112,
            "text-outline-width": 2,
            "text-outline-color": "#0a1926",
            "border-color": "#bfeaff",
            "border-width": 0.8,
            "overlay-opacity": 0,
            width: "mapData(importance, 1, 12, 22, 70)",
            height: "mapData(importance, 1, 12, 22, 70)"
          }
        },
        {
          selector: "node[kind = 'post']",
          style: {
            shape: "ellipse"
          }
        },
        {
          selector: "node[kind = 'topic-hub']",
          style: {
            shape: "round-rectangle",
            "font-size": 11,
            "text-max-width": 140,
            width: "mapData(importance, 1, 12, 80, 140)",
            height: "mapData(importance, 1, 12, 40, 58)",
            "border-width": 1.2
          }
        },
        {
          selector: "edge",
          style: {
            width: "mapData(weight, 0.5, 6, 1.1, 4)",
            "line-color": "#8dc2de",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#8dc2de",
            opacity: 0.8
          }
        },
        {
          selector: "edge[type = 'sequence']",
          style: {
            "line-color": "#66f0d3",
            "target-arrow-color": "#66f0d3"
          }
        },
        {
          selector: "edge[type = 'reference']",
          style: {
            "line-color": "#ffcc75",
            "target-arrow-color": "#ffcc75",
            "line-style": "dashed"
          }
        },
        {
          selector: "edge[type = 'topic']",
          style: {
            "line-color": "#9fc1ff",
            "target-arrow-color": "#9fc1ff"
          }
        },
        {
          selector: "edge[type = 'topic-bridge']",
          style: {
            "line-color": "#68d9ff",
            "target-arrow-color": "#68d9ff",
            "line-style": "dotted"
          }
        },
        {
          selector: ".hidden",
          style: {
            display: "none"
          }
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#ffffff",
            "border-width": 2
          }
        }
      ]
    });

    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      const data = node.data();
      if (!hoverEl) {
        return;
      }
      if (data.kind === "topic-hub") {
        hoverEl.innerHTML = `<h4>${escapeHtml(data.topic)}</h4><p>${escapeHtml(data.summary)}</p>`;
      } else {
        hoverEl.innerHTML = `
          <h4>${escapeHtml(data.fullLabel || data.title)}</h4>
          <p>Day ${escapeHtml(data.day || "-")} - ${escapeHtml(data.topic)}</p>
          <p>${escapeHtml(data.summary)}</p>
        `;
        updateInspector(data.id);
      }
      hoverEl.classList.add("is-visible");
    });

    cy.on("mousemove", "node", (event) => {
      if (!hoverEl) {
        return;
      }
      const offsetX = event.originalEvent?.offsetX || 0;
      const offsetY = event.originalEvent?.offsetY || 0;
      hoverEl.style.left = `${Math.min(offsetX + 18, canvasEl.clientWidth - 260)}px`;
      hoverEl.style.top = `${Math.max(offsetY - 16, 12)}px`;
    });

    cy.on("mouseout", "node", () => {
      if (!hoverEl) {
        return;
      }
      hoverEl.classList.remove("is-visible");
    });

    cy.on("tap", "node[kind = 'post']", (event) => {
      const data = event.target.data();
      if (data.url) {
        window.location.href = data.url;
      }
    });

    cy.on("tap", "node[kind = 'topic-hub']", (event) => {
      const data = event.target.data();
      state.topic = data.topic;
      if (topicFilterEl) {
        topicFilterEl.value = data.topic;
      }
      state.collapsed = false;
      updateClusterToggleText();
      renderGraph();
    });

    runLayout();
  };

  const runLayout = () => {
    if (!cy) {
      return;
    }

    const options = state.collapsed
      ? {
          name: "concentric",
          concentric: (node) => node.data("importance") || 1,
          levelWidth: () => 2,
          animate: true,
          animationDuration: 520,
          fit: true,
          padding: 44,
          minNodeSpacing: 40
        }
      : {
          name: "cose",
          animate: true,
          animationDuration: 520,
          fit: true,
          padding: 46,
          nodeRepulsion: 12000,
          idealEdgeLength: 120,
          edgeElasticity: 130,
          gravity: 0.22
        };

    cy.layout(options).run();
  };

  const updateInspector = (nodeId) => {
    const node = model.nodeById.get(nodeId);
    if (!node || !inspectorTitleEl || !inspectorMetaEl || !inspectorSummaryEl || !relatedListEl || !inspectorLinkEl) {
      return;
    }

    inspectorTitleEl.textContent = node.title;
    const dayLabel = node.day > 0 ? `Day ${node.day}` : "Unnumbered";
    inspectorMetaEl.textContent = `${dayLabel} - ${node.topic} - ${node.date}`;
    inspectorSummaryEl.textContent = node.summary;

    if (node.url) {
      inspectorLinkEl.href = node.url;
      inspectorLinkEl.hidden = false;
    } else {
      inspectorLinkEl.hidden = true;
    }

    const related = adjacency.get(nodeId) || [];
    if (related.length === 0) {
      relatedListEl.innerHTML = "<li>No related posts in current graph data.</li>";
      return;
    }

    const ranked = related
      .map((item) => ({ ...item, node: model.nodeById.get(item.target) }))
      .filter((item) => item.node)
      .sort((a, b) => {
        if ((a.node.day || 0) !== (b.node.day || 0)) {
          return (a.node.day || 0) - (b.node.day || 0);
        }
        return a.node.title.localeCompare(b.node.title);
      })
      .slice(0, 10);

    relatedListEl.innerHTML = ranked
      .map((item) => `<li><a href="${escapeHtml(item.node.url)}">${escapeHtml(item.node.title)}</a> <small>(${escapeHtml(item.type)})</small></li>`)
      .join("");
  };

  const applyExpandedFilters = () => {
    if (!cy) {
      return;
    }

    let visibleNodeCount = 0;
    let visibleEdgeCount = 0;

    cy.nodes().forEach((node) => {
      const data = node.data();
      if (data.kind !== "post") {
        node.addClass("hidden");
        return;
      }
      const searchTarget = `${data.fullLabel || data.title} ${data.topic} day ${data.day || ""}`.toLowerCase();
      const matchesSearch = !state.search || searchTarget.includes(state.search);
      const matchesTopic = state.topic === "all" || data.topic === state.topic;
      const day = Number(data.day || 0);
      const matchesDay = day === 0 || (day >= state.dayMin && day <= state.dayMax);
      const visible = matchesSearch && matchesTopic && matchesDay;
      node.toggleClass("hidden", !visible);
      if (visible) {
        visibleNodeCount += 1;
      }
    });

    cy.edges().forEach((edge) => {
      const type = edge.data("type");
      const sourceVisible = !edge.source().hasClass("hidden");
      const targetVisible = !edge.target().hasClass("hidden");
      const visible = state.edgeTypes.has(type) && sourceVisible && targetVisible;
      edge.toggleClass("hidden", !visible);
      if (visible) {
        visibleEdgeCount += 1;
      }
    });

    setStatus(`Showing ${visibleNodeCount} nodes and ${visibleEdgeCount} edges`);
  };

  const applyCollapsedFilters = () => {
    if (!cy) {
      return;
    }

    let visibleNodeCount = 0;
    let visibleEdgeCount = 0;

    cy.nodes().forEach((node) => {
      const data = node.data();
      const searchTarget = `${data.topic} ${data.label}`.toLowerCase();
      const matchesSearch = !state.search || searchTarget.includes(state.search);
      const matchesTopic = state.topic === "all" || data.topic === state.topic;
      const visible = matchesSearch && matchesTopic;
      node.toggleClass("hidden", !visible);
      if (visible) {
        visibleNodeCount += 1;
      }
    });

    cy.edges().forEach((edge) => {
      const sourceVisible = !edge.source().hasClass("hidden");
      const targetVisible = !edge.target().hasClass("hidden");
      const visible = sourceVisible && targetVisible;
      edge.toggleClass("hidden", !visible);
      if (visible) {
        visibleEdgeCount += 1;
      }
    });

    setStatus(`Collapsed view: ${visibleNodeCount} topic hubs and ${visibleEdgeCount} bridges`);
  };

  const updateClusterToggleText = () => {
    if (!clusterToggleEl) {
      return;
    }
    clusterToggleEl.textContent = state.collapsed ? "Expand topics" : "Collapse topics";
  };

  const renderGraph = () => {
    const elements = state.collapsed ? buildCollapsedElements() : expandedElements;

    if (!cy) {
      createCy(elements);
    } else {
      cy.json({ elements });
      runLayout();
    }

    if (state.collapsed) {
      applyCollapsedFilters();
    } else {
      applyExpandedFilters();
    }
  };

  const syncDayLabels = () => {
    if (dayMinValueEl) {
      dayMinValueEl.textContent = String(state.dayMin);
    }
    if (dayMaxValueEl) {
      dayMaxValueEl.textContent = String(state.dayMax);
    }
  };

  const bindUi = () => {
    if (searchEl) {
      searchEl.addEventListener("input", (event) => {
        state.search = (event.target.value || "").trim().toLowerCase();
        if (state.collapsed) {
          applyCollapsedFilters();
        } else {
          applyExpandedFilters();
        }
      });
    }

    if (topicFilterEl) {
      topicFilterEl.addEventListener("change", (event) => {
        state.topic = event.target.value || "all";
        if (state.collapsed) {
          applyCollapsedFilters();
        } else {
          applyExpandedFilters();
        }
      });
    }

    if (dayMinEl) {
      dayMinEl.addEventListener("input", (event) => {
        state.dayMin = Number(event.target.value || state.dayMin);
        if (state.dayMin > state.dayMax) {
          state.dayMax = state.dayMin;
          if (dayMaxEl) {
            dayMaxEl.value = String(state.dayMax);
          }
        }
        syncDayLabels();
        if (!state.collapsed) {
          applyExpandedFilters();
        }
      });
    }

    if (dayMaxEl) {
      dayMaxEl.addEventListener("input", (event) => {
        state.dayMax = Number(event.target.value || state.dayMax);
        if (state.dayMax < state.dayMin) {
          state.dayMin = state.dayMax;
          if (dayMinEl) {
            dayMinEl.value = String(state.dayMin);
          }
        }
        syncDayLabels();
        if (!state.collapsed) {
          applyExpandedFilters();
        }
      });
    }

    edgeTypeEls.forEach((checkbox) => {
      checkbox.addEventListener("change", (event) => {
        const value = event.target.value;
        if (event.target.checked) {
          state.edgeTypes.add(value);
        } else {
          state.edgeTypes.delete(value);
        }
        if (state.collapsed) {
          renderGraph();
        } else {
          applyExpandedFilters();
        }
      });
    });

    if (clusterToggleEl) {
      clusterToggleEl.addEventListener("click", () => {
        state.collapsed = !state.collapsed;
        updateClusterToggleText();
        renderGraph();
      });
    }

    if (layoutRefreshEl) {
      layoutRefreshEl.addEventListener("click", () => runLayout());
    }

    if (resetEl) {
      resetEl.addEventListener("click", () => {
        state.search = "";
        state.topic = "all";
        state.dayMin = model.minDay;
        state.dayMax = model.maxDay;
        state.edgeTypes = new Set(["sequence", "reference", "topic"]);
        state.collapsed = false;

        if (searchEl) {
          searchEl.value = "";
        }
        if (topicFilterEl) {
          topicFilterEl.value = "all";
        }
        if (dayMinEl) {
          dayMinEl.value = String(state.dayMin);
        }
        if (dayMaxEl) {
          dayMaxEl.value = String(state.dayMax);
        }
        edgeTypeEls.forEach((checkbox) => {
          checkbox.checked = true;
        });
        syncDayLabels();
        updateClusterToggleText();
        renderGraph();
      });
    }
  };

  const hydrateTopicFilter = () => {
    if (!topicFilterEl) {
      return;
    }

    const options = ["<option value=\"all\">All topics</option>"];
    model.topics.forEach((topic) => {
      options.push(`<option value=\"${escapeHtml(topic)}\">${escapeHtml(topic)}</option>`);
    });
    topicFilterEl.innerHTML = options.join("");
  };

  const setupDayControls = () => {
    state.dayMin = model.minDay;
    state.dayMax = model.maxDay;

    if (dayMinEl) {
      dayMinEl.min = String(model.minDay);
      dayMinEl.max = String(model.maxDay);
      dayMinEl.value = String(model.minDay);
    }

    if (dayMaxEl) {
      dayMaxEl.min = String(model.minDay);
      dayMaxEl.max = String(model.maxDay);
      dayMaxEl.value = String(model.maxDay);
    }

    syncDayLabels();
  };

  const dataUrl = (config.dataUrl || "").trim();
  if (!dataUrl) {
    setStatus("Missing graph data URL. Showing fallback list.");
    return;
  }

  fetch(dataUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch data (${response.status})`);
      }
      return response.json();
    })
    .then((rawData) => {
      model = normalizeModel(rawData);
      expandedElements = buildExpandedElements();

      hydrateTopicFilter();
      setupDayControls();
      bindUi();
      updateClusterToggleText();
      renderGraph();

      if (fallbackEl) {
        document.body.classList.add("java-graph-ready");
      }

      setStatus(`Loaded ${model.nodes.length} nodes and ${model.edges.length} edges`);
    })
    .catch((error) => {
      setStatus(`Could not load graph data: ${error.message}`);
    });
})();
