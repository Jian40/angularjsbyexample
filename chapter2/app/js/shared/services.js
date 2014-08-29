'use strict';

/* Services */
angular.module('app')
    .value("appEvents", {
        workout: { exerciseStarted: "event:workout:exerciseStarted" }
    });

angular.module('app')
    .provider("WorkoutService", function () {
        var apiUrl = "https://api.mongolab.com/api/1/databases/";
        var collectionsUrl = null;
        var database = null;
        var apiKey = null;

        this.configure = function (dbName, key) {
            database = database;
            apiKey = key;
            collectionsUrl = apiUrl + dbName + "/collections";
        }

        this.$get = ['WorkoutPlan', 'Exercise', '$http', '$q', function (WorkoutPlan, Exercise, $http, $q) {
            var service = {};
            var workouts = [];
            var exercises = [];

            service.getExercises = function () {
                return $http.get(collectionsUrl + "/exercises", { params: { apiKey: apiKey } })
                    .then(function (response) {
                        return response.data.map(function (exercise) {
                            return new Exercise(exercise);
                        })
                    });
            };

            service.getExercise = function (name) {
                return $http.get(collectionsUrl + "/exercises/" + name, { params: { apiKey: apiKey } })
                    .then(function (response) {
                        return new Exercise(response.data);
                    });
            };

            service.updateExercise = function (exercise) {
                angular.forEach(exercises, function (e, index) {
                    if (e.name === exercise.name) {
                        exercises[index] = exercise;
                    }
                });
                return exercise;
            };

            service.addExercise = function (exercise) {
                if (exercise.name) {
                    exercises.push(exercise);
                    return exercise;
                }
            }

            service.deleteExercise = function (exerciseName) {
                var exerciseIndex;
                angular.forEach(exercises, function (e, index) {
                    if (e.name === exerciseName) {
                        exerciseIndex = index;
                    }
                });
                if (exerciseIndex >= 0) exercises.splice(exerciseIndex, 1);
            };


            service.getWorkouts = function () {
                return $http.get(collectionsUrl + "/workouts", { params: { apiKey: apiKey } });
            };

            service.getWorkout = function (name) {
                return $q.all([service.getExercises(), $http.get(collectionsUrl + "/workouts/" + name, { params: { apiKey: apiKey } })])
                    .then(function (response) {
                        var allExercises = response[0];
                        var workout = new WorkoutPlan(response[1].data);
                        
                        angular.forEach(response[1].data.exercises, function (exercise, index) {
                            workout.exercises.push({ details: allExercises.filter(function (e) { return e.name === exercise.name; })[0], duration: exercise.duration });
                        });
                        return workout;
                    });
            };

            service.updateWorkout = function (workout) {
                return service.getWorkout(workout.name)
                    .then(function (original) {
                        if (original) {
                            var workoutToSave = angular.copy(workout);
                            workoutToSave.exercises = workoutToSave.exercises.map(function (exercise) { return { name: exercise.details.name, duration: exercise.duration } });
                            workoutToSave.name = original.name;     //Name change is not allowed once saved. As it maps to _id
                            return $http.put(collectionsUrl + "/workouts/" + original.name, workoutToSave, { params: { apiKey: apiKey } });
                        }
                    })
                    .then(function (response) {
                        return workout;
                    });
            };

            service.addWorkout = function (workout) {
                if (workout.name) {
                    var workoutToSave = angular.copy(workout);
                    workoutToSave.exercises = workoutToSave.exercises.map(function (exercise) { return { name: exercise.details.name, duration: exercise.duration } });
                    workoutToSave._id = workoutToSave.name;
                    return $http.post(collectionsUrl + "/workouts", workoutToSave, { params: { apiKey: apiKey } })
                                .then(function (response) {
                                    return workout
                                });
                }
            }

            service.deleteWorkout = function (workoutName) {
                var workoutIndex;
                angular.forEach(workouts, function (w, index) {
                    if (w.name === workoutName) {
                        workoutIndex = index;
                    }
                });
                workouts.splice(workoutIndex, 1);
            };

            return service;
        }];

        var init = function () {
        };

        init();
    });