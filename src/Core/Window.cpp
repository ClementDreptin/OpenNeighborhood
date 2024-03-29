#include "pch.h"
#include "Core/Window.h"

#include <glad/glad.h>

#define NFD_THROWS_EXCEPTIONS
#include <nfd.hpp>

#include <stb_image/stb_image.h>

#include "Events/AppEvent.h"
#include "Events/MouseEvent.h"
#include "Events/KeyEvent.h"
#include "Core/Log.h"
#include "Core/Assert.h"
#include "Helpers/Utils.h"

static bool s_GLFWInitialized = false;

static void GLFWErrorCallback(int error, const char *desc)
{
    Log::Error("GLFW error code: (%i) | %s", error, desc);
}

Window *Window::Create(const WindowProps &props)
{
    return new Window(props);
}

Window::Window(const WindowProps &props)
{
    Init(props);
}

Window::~Window()
{
    Shutdown();
}

void Window::Init(const WindowProps &props)
{
    m_Data.Title = props.Title;
    m_Data.Width = props.Width;
    m_Data.Height = props.Height;

    if (!s_GLFWInitialized)
    {
        int success = glfwInit();
        (void)success;
        ASSERT(success, "Could not initialize GLFW!");

        // Creating this object initializes the whole library
        NFD::Guard nfdGuard;

        glfwSetErrorCallback(GLFWErrorCallback);

        s_GLFWInitialized = true;
    }

    m_Window = glfwCreateWindow(static_cast<int>(props.Width), static_cast<int>(props.Height), m_Data.Title.c_str(), nullptr, nullptr);

    glfwMakeContextCurrent(m_Window);

    int status = gladLoadGLLoader(reinterpret_cast<GLADloadproc>(glfwGetProcAddress));
    (void)status;
    ASSERT(status, "Failed to initialize Glad!");

    glfwSetWindowUserPointer(m_Window, &m_Data);
    SetVSync(true);

    // Set the window icon
    GLFWimage icons[2];
    std::filesystem::path smallIconPath = Utils::GetExecDir() / "assets" / "icons" / "windowIcon32x32.png";
    std::filesystem::path bigIconPath = Utils::GetExecDir() / "assets" / "icons" / "windowIcon48x48.png";

    icons[0].pixels = stbi_load(smallIconPath.string().c_str(), &icons[0].width, &icons[0].height, nullptr, 4);
    icons[1].pixels = stbi_load(bigIconPath.string().c_str(), &icons[1].width, &icons[1].height, nullptr, 4);

    glfwSetWindowIcon(m_Window, 2, icons);

    stbi_image_free(icons[0].pixels);
    stbi_image_free(icons[1].pixels);

    // Set GLFW callbacks
    glfwSetWindowSizeCallback(m_Window, [](GLFWwindow *window, int width, int height) {
        WindowData &windowData = *reinterpret_cast<WindowData *>(glfwGetWindowUserPointer(window));
        windowData.Width = static_cast<float>(width);
        windowData.Height = static_cast<float>(height);

        WindowResizeEvent event(static_cast<float>(width), static_cast<float>(height));
        windowData.EventCallback(event);
    });

    glfwSetWindowCloseCallback(m_Window, [](GLFWwindow *window) {
        WindowData &windowData = *reinterpret_cast<WindowData *>(glfwGetWindowUserPointer(window));
        WindowCloseEvent event;
        windowData.EventCallback(event);
    });

    glfwSetKeyCallback(m_Window, [](GLFWwindow *window, int key, int, int action, int) {
        WindowData &windowData = *reinterpret_cast<WindowData *>(glfwGetWindowUserPointer(window));

        switch (action)
        {
        case GLFW_PRESS: {
            KeyPressedEvent event(key, 0);
            windowData.EventCallback(event);
            break;
        }
        case GLFW_RELEASE: {
            KeyReleasedEvent event(key);
            windowData.EventCallback(event);
            break;
        }
        case GLFW_REPEAT: {
            KeyPressedEvent event(key, 1);
            windowData.EventCallback(event);
            break;
        }
        }
    });

    glfwSetCharCallback(m_Window, [](GLFWwindow *window, unsigned int keyCode) {
        WindowData &windowData = *reinterpret_cast<WindowData *>(glfwGetWindowUserPointer(window));

        KeyTypedEvent event(keyCode);
        windowData.EventCallback(event);
    });

    glfwSetMouseButtonCallback(m_Window, [](GLFWwindow *window, int button, int action, int) {
        WindowData &windowData = *reinterpret_cast<WindowData *>(glfwGetWindowUserPointer(window));

        switch (action)
        {
        case GLFW_PRESS: {
            MouseButtonPressedEvent event(button);
            windowData.EventCallback(event);
            break;
        }
        case GLFW_RELEASE: {
            MouseButtonReleasedEvent event(button);
            windowData.EventCallback(event);
            break;
        }
        }
    });

    glfwSetScrollCallback(m_Window, [](GLFWwindow *window, double xOffset, double yOffset) {
        WindowData &windowData = *reinterpret_cast<WindowData *>(glfwGetWindowUserPointer(window));

        MouseScrolledEvent event(static_cast<float>(xOffset), static_cast<float>(yOffset));
        windowData.EventCallback(event);
    });

    glfwSetCursorPosCallback(m_Window, [](GLFWwindow *window, double x, double y) {
        WindowData &windowData = *reinterpret_cast<WindowData *>(glfwGetWindowUserPointer(window));

        MouseMovedEvent event(static_cast<float>(x), static_cast<float>(y));
        windowData.EventCallback(event);
    });
}

void Window::Shutdown()
{
    glfwDestroyWindow(m_Window);
}

void Window::OnUpdate()
{
    glfwPollEvents();
    glfwSwapBuffers(m_Window);
}

void Window::SetVSync(bool enabled)
{
    glfwSwapInterval(static_cast<int>(enabled));

    m_Data.VSync = enabled;
}
