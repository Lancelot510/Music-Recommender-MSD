

  // Fetch the CSV file
  fetch('data/song_genre_year.csv')
    .then(response => response.text())
    .then(data => {
      // Process the CSV data
      processData(data);
    });

  // Process the CSV data
  function processData(csvData) {
    // Split the CSV data into rows
    var rows = csvData.split('\n');

    // Extract headers from the first row
    var headers = rows[0].split(',');

    // Initialize arrays to store data
    var data = [];
    var genreSet = new Set();

    // Iterate through rows starting from the second row (index 1)
    for (var i = 1; i < rows.length; i++) {
      var values = rows[i].split(',');

      // Assuming 'tempo', 'loudness', 'title', 'genre', and 'year' are columns in your CSV
      var tempo = parseFloat(values[49]);  // Replace with the correct index for 'tempo'
    //   console.log(tempo)
      var loudness = parseFloat(values[45]);  // Replace with the correct index for 'loudness'
      var title = values[20];  // Replace with the correct index for 'title'
      var genre = values[2];  // Replace with the correct index for 'genre'
      var year = parseInt(values[53]);  // Replace with the correct index for 'year'
      console.log(year, genre)

      if (genre !== undefined) {
        data.push({ tempo, loudness, title, genre, year });
        genreSet.add(genre);
      }
    }

    // Convert genre set to an array
    var uniqueGenres = Array.from(genreSet);

    // Use D3 color scale for the genres
    var colorScale = d3.scaleOrdinal(d3.schemeCategory20c); // You can choose a different D3 color scheme

    // Create a dropdown select option for years
    var yearDropdown = document.getElementById('year-dropdown');
    var uniqueYears = [...new Set(data.map(row => row.year))];
    uniqueYears.sort((a, b) => b - a);  // Sort in descending order
    // console.log(uniqueYears)
    uniqueYears.forEach(year => {
        // console.log(year)
      var option = document.createElement('option');
      option.value = year;
      option.text = year;
      yearDropdown.add(option);
    });

    // Handle the change event of the year dropdown
    yearDropdown.addEventListener('change', function () {
      var selectedYear = this.value;
      updateChart(selectedYear);
    });

    // Initial chart with the first year
    updateChart(uniqueYears[0]);

    // Function to update the chart based on the selected year
    function updateChart(selectedYear) {
      // Filter data for the selected year
      var filteredData = data.filter(row => row.year == selectedYear);

      // Create an array to store traces for each genre
      var traces = [];

      // Iterate over unique genres and create a trace for each
      
      uniqueGenres.forEach(genre => {
        var genreData = filteredData.filter(row => row.genre === genre);

        var trace = {
          x: genreData.map(row => row.tempo),
          y: genreData.map(row => row.loudness),
          mode: 'markers',
          type: 'scatter',
          text: genreData.map(row => row.title),
          marker: {
            size: 5,
            color: colorScale(genre), // Assign color based on genre using the D3 color scale
          },
          name: genre, // This sets the legend label
        };

        traces.push(trace);
      });


      var layout = {
        title: 'Tempo vs Loudness Scatter Plot',
        xaxis: { title: 'Tempo (beats per minute)' },
        yaxis: { title: 'Loudness (dB)' },
        showlegend: true, // Display the legend
        legend: {
            x: 1,  // Adjust the x position of the legend
            y: 1,  // Adjust the y position of the legend
            font: {
              family: 'Arial, sans-serif',
              size: 16,  // Adjust the size of the legend text
              color: 'grey',
            }
          },
      };

      // Update the plot with the new traces
      Plotly.newPlot('your-plot-container', traces, layout);
    }
  }


