// Estado da aplicação
let budgetItems = [];
let budgetCounter = 0;

// Elementos DOM
const elements = {
  form: document.getElementById("productForm"),
  description: document.getElementById("description"),
  quantity: document.getElementById("quantity"),
  unitPrice: document.getElementById("unitPrice"),
  iva: document.getElementById("iva"),
  discount: document.getElementById("discount"),
  addBtn: document.getElementById("addBtn"),
  budgetBody: document.getElementById("budgetBody"),
  subtotalDisplay: document.getElementById("subtotalDisplay"),
  discountDisplay: document.getElementById("discountDisplay"),
  ivaDisplay: document.getElementById("ivaDisplay"),
  totalDisplay: document.getElementById("totalDisplay"),
  dateInput: document.getElementById("date"),
};

// Inicialização
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  // Definir data atual
  elements.dateInput.value = new Date().toISOString().split("T")[0];

  // Event listeners
  elements.form.addEventListener("submit", handleAddProduct);

  // Validação em tempo real
  [elements.description, elements.quantity, elements.unitPrice].forEach(
    (input) => {
      input.addEventListener("input", validateForm);
    }
  );

  // Atualizar cálculos quando IVA ou desconto mudarem
  elements.iva.addEventListener("input", updateBudgetSummary);
  elements.discount.addEventListener("input", updateBudgetSummary);

  validateForm();
}

function validateForm() {
  const isValid =
    elements.description.value.trim() !== "" &&
    elements.quantity.value !== "" &&
    elements.unitPrice.value !== "" &&
    parseFloat(elements.quantity.value) > 0 &&
    parseFloat(elements.unitPrice.value) >= 0;

  elements.addBtn.disabled = !isValid;
}

function handleAddProduct(event) {
  event.preventDefault();

  const product = {
    id: ++budgetCounter,
    description: elements.description.value.trim(),
    quantity: parseFloat(elements.quantity.value),
    unitPrice: parseFloat(elements.unitPrice.value),
    iva: parseFloat(elements.iva.value) || 0,
    discount: parseFloat(elements.discount.value) || 0,
  };

  // Calcular valores
  product.subtotal = product.quantity * product.unitPrice;
  product.discountAmount = product.subtotal * (product.discount / 100);
  product.subtotalAfterDiscount = product.subtotal - product.discountAmount;
  product.ivaAmount = product.subtotalAfterDiscount * (product.iva / 100);
  product.total = product.subtotalAfterDiscount + product.ivaAmount;

  budgetItems.push(product);
  addProductToTable(product);
  updateBudgetSummary();
  clearForm();

  // Animação de adição
  const newRow = elements.budgetBody.lastElementChild;
  newRow.classList.add("fade-in");
}

function addProductToTable(product) {
  const row = elements.budgetBody.insertRow();
  row.dataset.productId = product.id;

  row.innerHTML = `
        <td>${product.description}</td>
        <td>${product.quantity}</td>
        <td>${formatCurrency(product.unitPrice)}</td>
        <td>${product.discount}%</td>
        <td>${formatCurrency(product.subtotalAfterDiscount)}</td>
        <td>${formatCurrency(product.ivaAmount)}</td>
        <td>${formatCurrency(product.total)}</td>
        <td>
            <button class="remove-btn" onclick="removeProduct(${product.id})">
                🗑️ Eliminar
            </button>
        </td>
    `;
}

function removeProduct(productId) {
  // Remover do array
  budgetItems = budgetItems.filter((item) => item.id !== productId);

  // Remover da tabela
  const row = document.querySelector(`tr[data-product-id="${productId}"]`);
  if (row) {
    row.remove();
  }

  updateBudgetSummary();
}

function updateBudgetSummary() {
  const totals = budgetItems.reduce(
    (acc, item) => {
      acc.subtotal += item.subtotalAfterDiscount;
      acc.discount += item.discountAmount;
      acc.iva += item.ivaAmount;
      acc.total += item.total;
      return acc;
    },
    { subtotal: 0, discount: 0, iva: 0, total: 0 }
  );

  elements.subtotalDisplay.textContent = formatCurrency(totals.subtotal);
  elements.discountDisplay.textContent = formatCurrency(totals.discount);
  elements.ivaDisplay.textContent = formatCurrency(totals.iva);
  elements.totalDisplay.textContent = formatCurrency(totals.total);
}

function clearForm() {
  elements.description.value = "";
  elements.quantity.value = "";
  elements.unitPrice.value = "";
  elements.discount.value = "0";
  validateForm();
  elements.description.focus();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function getClientInfo() {
  return {
    presupuesto: document.getElementById("presupuesto").value || "N/A",
    name: document.getElementById("name").value || "N/A",
    address: document.getElementById("address").value || "N/A",
    city: document.getElementById("city").value || "N/A",
    date:
      document.getElementById("date").value ||
      new Date().toISOString().split("T")[0],
    validity: document.getElementById("validity").value || "30",
  };
}

// Dados da empresa
const companyInfo = {
  name: "Empresa Exemplo S.L.",
  address: "Calle Mayor, 123, 28001 Madrid",
  phone: "+34 91 123 45 67",
  logo: "https://via.placeholder.com/150x50?text=Logo+Empresa",
};
const logoPath = "Logo.png";

async function getBase64ImageFromUrl(logoPath) {
  const response = await fetch(logoPath);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject("Erro ao converter para base64");
    reader.readAsDataURL(blob);
  });
}
// Funções de exportação
async function exportToPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const clientInfo = getClientInfo();

    // Configurações
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Carrega e adiciona o logo
    const logoBase64 = await getBase64ImageFromUrl(logoPath);
    doc.addImage(logoBase64, "PNG", margin, yPosition, 40, 15); // x, y, largura, altura
    yPosition += 20;

    // Dados da empresa
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(companyInfo.name, margin, yPosition);
    yPosition += 7;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.text(companyInfo.address, margin, yPosition);
    yPosition += 5;
    doc.text(companyInfo.phone, margin, yPosition);
    yPosition += 15;

    // Cabeçalho
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("PRESUPUESTO", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Informações do cliente
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("INFORMACIÓN DEL CLIENTE", margin, yPosition);
    yPosition += 10;

    doc.setFont(undefined, "normal");
    doc.text(`Presupuesto: ${clientInfo.presupuesto}`, margin, yPosition);
    doc.text(
      `Fecha: ${new Date(clientInfo.date).toLocaleDateString("es-ES")}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 7;

    doc.text(`Cliente: ${clientInfo.name}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Dirección: ${clientInfo.address}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Ciudad: ${clientInfo.city}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Validez: ${clientInfo.validity} días`, margin, yPosition);
    yPosition += 15;

    // Tabela de produtos
    if (budgetItems.length > 0) {
      const tableData = budgetItems.map((item) => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unitPrice),
        `${item.discount}%`,
        formatCurrency(item.subtotalAfterDiscount),
        formatCurrency(item.ivaAmount),
        formatCurrency(item.total),
      ]);

      doc.autoTable({
        head: [
          [
            "Descripción",
            "Cant.",
            "Valor Unit.",
            "Desc.",
            "Subtotal",
            "IVA",
            "Total",
          ],
        ],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: margin, right: margin },
      });

      // Resumo
      const finalY = doc.lastAutoTable.finalY + 10;
      const totals = budgetItems.reduce(
        (acc, item) => {
          acc.subtotal += item.subtotalAfterDiscount;
          acc.discount += item.discountAmount;
          acc.iva += item.ivaAmount;
          acc.total += item.total;
          return acc;
        },
        { subtotal: 0, discount: 0, iva: 0, total: 0 }
      );

      doc.setFont(undefined, "bold");
      doc.text(
        `Subtotal: ${formatCurrency(totals.subtotal)}`,
        pageWidth - margin - 80,
        finalY
      );
      doc.text(
        `Descuentos: ${formatCurrency(totals.discount)}`,
        pageWidth - margin - 80,
        finalY + 7
      );
      doc.text(
        `IVA/Impuestos: ${formatCurrency(totals.iva)}`,
        pageWidth - margin - 80,
        finalY + 14
      );
      doc.setFontSize(14);
      doc.text(
        `TOTAL: ${formatCurrency(totals.total)}`,
        pageWidth - margin - 80,
        finalY + 25
      );
    }

    doc.save(`presupuesto_${clientInfo.presupuesto || "sin_numero"}.pdf`);
    showNotification("PDF generado con éxito!", "success");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    showNotification("Error al generar PDF. Inténtelo de nuevo.", "error");
  }
}

function exportToWord() {
  try {
    const clientInfo = getClientInfo();
    const totals = budgetItems.reduce(
      (acc, item) => {
        acc.subtotal += item.subtotalAfterDiscount;
        acc.discount += item.discountAmount;
        acc.iva += item.ivaAmount;
        acc.total += item.total;
        return acc;
      },
      { subtotal: 0, discount: 0, iva: 0, total: 0 }
    );

    // Crear tabela de produtos
    const tableRows = budgetItems.map(
      (item) =>
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [new docx.Paragraph(item.description)],
            }),
            new docx.TableCell({
              children: [new docx.Paragraph(item.quantity.toString())],
            }),
            new docx.TableCell({
              children: [new docx.Paragraph(formatCurrency(item.unitPrice))],
            }),
            new docx.TableCell({
              children: [new docx.Paragraph(`${item.discount}%`)],
            }),
            new docx.TableCell({
              children: [
                new docx.Paragraph(formatCurrency(item.subtotalAfterDiscount)),
              ],
            }),
            new docx.TableCell({
              children: [new docx.Paragraph(formatCurrency(item.ivaAmount))],
            }),
            new docx.TableCell({
              children: [new docx.Paragraph(formatCurrency(item.total))],
            }),
          ],
        })
    );

    const doc = new docx.Document({
      sections: [
        {
          children: [
            // Cabeçalho da empresa
            new docx.Paragraph({
              text: companyInfo.name,
              heading: docx.HeadingLevel.HEADING_2,
              alignment: docx.AlignmentType.LEFT,
            }),
            new docx.Paragraph({
              text: companyInfo.address,
              alignment: docx.AlignmentType.LEFT,
            }),
            new docx.Paragraph({
              text: companyInfo.phone,
              alignment: docx.AlignmentType.LEFT,
            }),
            new docx.Paragraph({ text: "" }),
            new docx.Paragraph({
              text: "PRESUPUESTO",
              heading: docx.HeadingLevel.TITLE,
              alignment: docx.AlignmentType.CENTER,
            }),
            new docx.Paragraph({ text: "" }),
            new docx.Paragraph({
              text: "INFORMACIÓN DEL CLIENTE",
              heading: docx.HeadingLevel.HEADING_1,
            }),
            new docx.Paragraph(`Presupuesto: ${clientInfo.presupuesto}`),
            new docx.Paragraph(
              `Fecha: ${new Date(clientInfo.date).toLocaleDateString("es-ES")}`
            ),
            new docx.Paragraph(`Cliente: ${clientInfo.name}`),
            new docx.Paragraph(`Dirección: ${clientInfo.address}`),
            new docx.Paragraph(`Ciudad: ${clientInfo.city}`),
            new docx.Paragraph(`Validez: ${clientInfo.validity} días`),
            new docx.Paragraph({ text: "" }),
            new docx.Paragraph({
              text: "ARTÍCULOS DEL PRESUPUESTO",
              heading: docx.HeadingLevel.HEADING_1,
            }),
            new docx.Table({
              rows: [
                new docx.TableRow({
                  children: [
                    new docx.TableCell({
                      children: [new docx.Paragraph("Descripción")],
                    }),
                    new docx.TableCell({
                      children: [new docx.Paragraph("Cant.")],
                    }),
                    new docx.TableCell({
                      children: [new docx.Paragraph("Valor Unit.")],
                    }),
                    new docx.TableCell({
                      children: [new docx.Paragraph("Desc.")],
                    }),
                    new docx.TableCell({
                      children: [new docx.Paragraph("Subtotal")],
                    }),
                    new docx.TableCell({
                      children: [new docx.Paragraph("IVA")],
                    }),
                    new docx.TableCell({
                      children: [new docx.Paragraph("Total")],
                    }),
                  ],
                }),
                ...tableRows,
              ],
            }),
            new docx.Paragraph({ text: "" }),
            new docx.Paragraph({
              text: "RESUMEN",
              heading: docx.HeadingLevel.HEADING_1,
            }),
            new docx.Paragraph(`Subtotal: ${formatCurrency(totals.subtotal)}`),
            new docx.Paragraph(
              `Total de Descuentos: ${formatCurrency(totals.discount)}`
            ),
            new docx.Paragraph(
              `Total de IVA/Impuestos: ${formatCurrency(totals.iva)}`
            ),
            new docx.Paragraph({
              text: `TOTAL GENERAL: ${formatCurrency(totals.total)}`,
              bold: true,
            }),
          ],
        },
      ],
    });

    docx.Packer.toBlob(doc).then((blob) => {
      saveAs(
        blob,
        `presupuesto_${clientInfo.presupuesto || "sin_numero"}.docx`
      );
      showNotification("Documento Word generado con éxito!", "success");
    });
  } catch (error) {
    console.error("Error al generar Word:", error);
    showNotification(
      "Error al generar documento Word. Inténtelo de nuevo.",
      "error"
    );
  }
}

function exportToExcel() {
  try {
    const clientInfo = getClientInfo();

    // Dados da empresa e cliente
    const clientData = [
      [companyInfo.name],
      [companyInfo.address],
      [companyInfo.phone],
      [""],
      ["PRESUPUESTO"],
      [""],
      ["INFORMACIÓN DEL CLIENTE"],
      ["Presupuesto:", clientInfo.presupuesto],
      ["Fecha:", new Date(clientInfo.date).toLocaleDateString("es-ES")],
      ["Cliente:", clientInfo.name],
      ["Dirección:", clientInfo.address],
      ["Ciudad:", clientInfo.city],
      ["Validez:", `${clientInfo.validity} días`],
      [""],
      ["ARTÍCULOS DEL PRESUPUESTO"],
      [
        "Descripción",
        "Cantidad",
        "Valor Unitario",
        "Descuento (%)",
        "Subtotal",
        "IVA",
        "Total",
      ],
    ];

    // Dados dos produtos
    const productData = budgetItems.map((item) => [
      item.description,
      item.quantity,
      item.unitPrice,
      item.discount,
      item.subtotalAfterDiscount,
      item.ivaAmount,
      item.total,
    ]);

    // Resumo
    const totals = budgetItems.reduce(
      (acc, item) => {
        acc.subtotal += item.subtotalAfterDiscount;
        acc.discount += item.discountAmount;
        acc.iva += item.ivaAmount;
        acc.total += item.total;
        return acc;
      },
      { subtotal: 0, discount: 0, iva: 0, total: 0 }
    );

    const summaryData = [
      [""],
      ["RESUMEN"],
      ["Subtotal:", totals.subtotal],
      ["Total de Descuentos:", totals.discount],
      ["Total de IVA/Impuestos:", totals.iva],
      ["TOTAL GENERAL:", totals.total],
    ];

    // Combinar todos os dados
    const allData = [...clientData, ...productData, ...summaryData];

    // Criar workbook
    const ws = XLSX.utils.aoa_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presupuesto");

    // Salvar arquivo
    XLSX.writeFile(
      wb,
      `presupuesto_${clientInfo.presupuesto || "sin_numero"}.xlsx`
    );
    showNotification("Hoja de cálculo Excel generada con éxito!", "success");
  } catch (error) {
    console.error("Error al generar Excel:", error);
    showNotification(
      "Error al generar hoja de cálculo Excel. Inténtelo de nuevo.",
      "error"
    );
  }
}

function showNotification(message, type = "info") {
  // Criar elemento de notificação
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Estilos da notificação
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    color: "white",
    fontWeight: "500",
    zIndex: "1000",
    opacity: "0",
    transform: "translateX(100%)",
    transition: "all 0.3s ease",
  });

  // Cores baseadas no tipo
  const colors = {
    success: "#059669",
    error: "#dc2626",
    info: "#2563eb",
  };
  notification.style.backgroundColor = colors[type] || colors.info;

  document.body.appendChild(notification);

  // Animação de entrada
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateX(0)";
  }, 100);

  // Remover após 3 segundos
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
