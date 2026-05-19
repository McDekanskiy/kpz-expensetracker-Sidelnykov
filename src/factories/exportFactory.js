class JsonExporter {
  export(data) { return JSON.stringify(data, null, 2); }
}

class CsvExporter {
  export(data) {
    if (!Array.isArray(data) || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((item) => headers.map((key) => item[key]).join(','));
    return [headers.join(','), ...rows].join('\n');
  }
}

class TextExporter {
  export(data) { return data.map((item) => `${item.date}: ${item.category} - ${item.amount}`).join('\n'); }
}

class ExportFactory {
  static create(format) {
    const exporters = { json: JsonExporter, csv: CsvExporter, text: TextExporter };
    const Exporter = exporters[format];
    if (!Exporter) throw new Error(`Unsupported export format: ${format}`);
    return new Exporter();
  }
}

module.exports = { ExportFactory, JsonExporter, CsvExporter, TextExporter };
