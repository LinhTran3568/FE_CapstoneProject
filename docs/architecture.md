# Capstone FE Architecture Overview

## Executive Summary
This project provides a clean, production-ready Front-End monorepo architecture for Capstone applications, consisting of a React + Vite Web application, a React Native Expo Mobile application, and shared package utilities.

## System Architecture Diagram
```
+-----------------------------------------------------------------------+
|                           CLIENT LAYER                                |
|  +-----------------------------------+  +--------------------------+  |
|  |     React + Vite Web App          |  |  React Native Expo App   |  |
|  +-----------------------------------+  +--------------------------+  |
+-----------------------------------||----------------------------------+
                                    || HTTPS / REST API
+-----------------------------------\/----------------------------------+
|                            BACKEND API SERVICE                        |
+-----------------------------------------------------------------------+
```

