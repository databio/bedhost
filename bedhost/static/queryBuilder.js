var rules_basic = {
  rules: [{
    id: 'num_regions',
    operator: 'less',
    value: 100000
  },
  {
    id: 'gc_content',
    operator: 'less',
    value: 0.5
  },
  {
    id: 'mean_abs_tss_dist',
    operator: 'less',
    value: 100
  },
  {
    id: 'id',
    operator: 'equal',
    value: "ews1"
  },
  {
    id: 'md5sum',
    operator: 'not_equal',
    value: "ews1"
  }
  ]
};

//$('#builder-basic').queryBuilder({
//  plugins: {
//    'bt-tooltip-errors': null
//  },
//  filters: [{
//  id: 'num_regions',
//  label: 'Regions count',
//  type: 'integer',
//  validation: {
//    min: 1,
//    step: 1
//  }},
//  {
//  id: 'gc_content',
//  label: 'GC content',
//  type: 'double',
//  validation: {
//    min: 0,
//    step: 0.01
//  }}],
//  rules: rules_basic
//});


$('#builder-basic').queryBuilder({
  plugins: {
    'bt-tooltip-errors': null
  },
  filters: [
  {% for filter in filters %}
    {
    id: {{ filter["name"] }},
    label: {{ filter["name"] }},
    type: {{ filter["type"] }},
    {% if filter["validation"] is not none %}
      validation: {
        min: {{ filter["validation"]["min"] }},
        step: {{ filter["validation"]["step"] }}
      }
    {% endif %}
    }{{ "," if not loop.last }}
  {% endfor %}
  ],rules: rules_basic
});



$('#btn-reset').on('click', function() {
  $('#builder-basic').queryBuilder('reset');
  $('#search-results').html("");
});

$('#btn-show-elastic').on('click', function() {
  var result = $('#builder-basic').queryBuilder('getESBool');
  if (!$.isEmptyObject(result)) {
    prompt("Copy the Elasticsearch query to clipboard", JSON.stringify(result, null, 2))
  }
});

$('#btn-post-elastic').on('click', function() {
  var result = $('#builder-basic').queryBuilder('getESBool');

  var request = $.ajax({
      url: "/bedfiles_filter_result",
      type: "post",
      data: JSON.stringify(result),
      contentType: "application/json; charset=utf-8",
      dataType: "html"
      });
  request.done(function(data){
        console.log("Data received: " + data);
        $('#search-results').html(data);
    });
  request.fail(function(jqXHR, textStatus){
        console.log('Something went wrong: ' + textStatus);
    });
  request.always(function(jqXHR, textStatus) {
       console.log('Ajax request was finished')
    });
})