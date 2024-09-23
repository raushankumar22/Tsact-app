// State management
let state = {
    transactions: [],
    filteredTransactions: [],
    currentPage: 1,
    itemsPerPage: 10,
    selectedMonth: "",
    searchTerm: "",
    totalPages: 0,
  };
  
  // DOM Elements
  const noDataFound = document.getElementById("noDataFound");
  const monthSelect = document.getElementById("monthSelect");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const transactionTable = document.getElementById("transactionTable");
  const currentPageSpan = document.getElementById("currentPage");
  const barChartCanvas = document.getElementById("barChart");
  const pieChartCanvas = document.getElementById("pieChart");
  const paginationContainer = document.getElementById("pagination-container");
  
  let barChart;
  let pieChart;
  
  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };
  
  // Function to update totalPages
  const updateTotalPages = () => {
    state.totalPages = Math.ceil(
      state.filteredTransactions.length / state.itemsPerPage
    );
  };
  
  // Function to fetch transactions data
  async function fetchTransactions() {
    const response = await fetch(
      "https://fe-assignment.s3.ap-south-1.amazonaws.com/ecommerce-data.json"
    );
  
    const data = await response.json();
    state.transactions = data;
    state.filteredTransactions = data;
  }
  
  function populateMonthSelect() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
  
    months.forEach((month) => {
      const option = document.createElement("option");
      option.value = month.toLowerCase();
      option.textContent = month;
      monthSelect.appendChild(option);
    });
  }
  
  // Update table based on current state
  function updateTable() {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
  
    const displayedTransactions = state.filteredTransactions.slice(
      startIndex,
      endIndex
    );
  
    const tbody = transactionTable.querySelector("tbody");
    tbody.innerHTML = "";
  
    displayedTransactions.forEach((transaction) => {
      const row = document.createElement("tr");
      const words = transaction.description.split(" ");
      const truncatedText = words.slice(0, 15).join(" ");
      const hasMoreText = words.length > 15;
  
      row.innerHTML = `
        <td>${transaction.id}</td>
        <td>${transaction.title}</td>
        <td>$${transaction.price.toFixed(2)}</td>
        <td class="description-cell">
          <span class="truncated-description">${truncatedText}${
        hasMoreText ? "..." : ""
      }</span>
          ${hasMoreText ? '<button class="read-more">Read more</button>' : ""}
        </td>
        <td>${transaction.category}</td>
        <td>${transaction.sold ? "Yes" : "No"}</td>
        <td>${new Date(transaction.dateOfSale).toLocaleDateString()}</td>
      `;
      tbody.appendChild(row);
  
      if (hasMoreText) {
        const readMoreBtn = row.querySelector(".read-more");
        readMoreBtn.addEventListener("click", () =>
          openModal(transaction.description)
        );
      }
    });
  }
  
  // Function to filter transactions based on month and search term
  function filterTransactions() {
    let transactions = state.transactions.filter((transaction) => {
      const transactionMonth = new Date(transaction.dateOfSale).toLocaleString(
        "default",
        { month: "long" }
      );
  
      const monthMatch =
        !state.selectedMonth ||
        transactionMonth.toLowerCase() === state.selectedMonth;
      const searchMatch =
        !state.searchTerm ||
        transaction.title
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        transaction.description
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase());
      return monthMatch && searchMatch;
    });
  
    state.filteredTransactions = transactions.sort(function (a, b) {
      return a[state.sortedBy] - b[state.sortedBy];
    });
  
    state.currentPage = 1;
  
    if (state.filteredTransactions.length === 0) {
      paginationContainer.style.display = "none";
      transactionTable.style.display = "none";
      noDataFound.style.display = "block";
      document.querySelector(".charts").style.display = "none";
    } else {
      paginationContainer.style.display = "block";
      transactionTable.style.display = "block";
      noDataFound.style.display = "none";
      document.querySelector(".charts").style.display = "flex";
    }
  
    updateTotalPages();
    updateTable();
    createPagination(state.totalPages, state.currentPage);
    updateCharts();
  }
  
  // Event Listeners
  function addEventListeners() {
    monthSelect.addEventListener("change", (e) => {
      state.selectedMonth = e.target.value;
      filterTransactions();
    });
  
    searchInput.addEventListener("input", (e) =>
      debounce(() => {
        state.searchTerm = e.target.value;
        filterTransactions();
      }, 500)
    );
  
    sortSelect.addEventListener("change", (e) => {
      state.sortedBy = e.target.value;
      filterTransactions();
    });
  }
  
  // Function to update charts based on current state
  function updateCharts() {
    const categoryTotals = state.filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.price;
      return acc;
    }, {});
  
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
  
    if (barChart) barChart.destroy();
  
    barChart = new Chart(barChartCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Price By Category",
            data: data,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Total Price ($)",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "Total Price by Category",
          },
        },
      },
    });
    if (pieChart) pieChart.destroy();
  
    pieChart = new Chart(pieChartCanvas, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(75, 192, 192, 0.6)",
              "rgba(153, 102, 255, 0.6)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Price Distribution by Category",
          },
        },
      },
    });
  }
  
  // Function to create Pagination
  function createPagination(totalPages, currentPage) {
    paginationContainer.innerHTML = ""; // Clear the existing pagination
  
    if (state.filteredTransactions.length === 0) return;
  
    const ul = document.createElement("ul");
    ul.classList.add("pagination");
  
    // Create First Page
    if (currentPage !== 1)
      ul.appendChild(createPageItem(1, currentPage, totalPages));
  
    // Create "..." before current page if needed
    if (currentPage > 3) {
      ul.appendChild(createDots());
    }
  
    // Create Current Page - 1
    if (currentPage > 2) {
      ul.appendChild(createPageItem(currentPage - 1, currentPage, totalPages));
    }
  
    // Create Current Page
    ul.appendChild(createPageItem(currentPage, currentPage, totalPages, true));
  
    // Create Current Page + 1
    if (currentPage < totalPages - 1) {
      ul.appendChild(createPageItem(currentPage + 1, currentPage, totalPages));
    }
  
    // Create "..." after current page if needed
    if (currentPage < totalPages - 2) {
      ul.appendChild(createDots());
    }
  
    // Create Last Page
    if (currentPage !== totalPages)
      ul.appendChild(createPageItem(totalPages, currentPage, totalPages));
  
    paginationContainer.appendChild(ul);
  }
  
  // Function to create a single page item
  function createPageItem(page, currentPage, totalPages, isActive = false) {
    const li = document.createElement("li");
    li.textContent = Math.ceil(page);
    li.classList.toggle("active", isActive);
  
    if (!isActive) {
      li.addEventListener("click", function () {
        state.currentPage = page;
        updateTable();
        createPagination(totalPages, page);
      });
    }
  
    return li;
  }
  
  // Function to create dots
  function createDots() {
    const li = document.createElement("li");
    li.textContent = "...";
    li.classList.add("disabled");
    return li;
  }
  
  // Function to open the modal
  function openModal(description) {
    const modal = document.getElementById("descriptionModal");
    if (!modal) {
      createModal();
    }
    const fullDescription = document.querySelector(".full-description");
    fullDescription.textContent = description;
    document.getElementById("descriptionModal").style.display = "block";
  }
  
  // Function to create modal
  function createModal() {
    const modalHTML = `
      <div id="descriptionModal" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Full Description</h2>
          <p class="full-description"></p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  
    const modal = document.getElementById("descriptionModal");
    const closeBtn = modal.querySelector(".close");
  
    closeBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  
    window.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }
  
  // Close modal on Esc key press
  document.addEventListener("keydown", function (e) {
    const modal = document.getElementById("descriptionModal");
    if (e.key === "Escape" && modal && modal.style.display === "block") {
      modal.style.display = "none";
    }
  });
  
  // Function to populate month select, table data and chart data
  async function initializeApp() {
    populateMonthSelect();
    await fetchTransactions();
    updateTable();
    addEventListeners();
    const totalPages = Math.ceil(
      state.filteredTransactions.length / state.itemsPerPage
    );
    createPagination(totalPages, state.currentPage);
    updateCharts();
  }
  
  // Initialize the application
  initializeApp();