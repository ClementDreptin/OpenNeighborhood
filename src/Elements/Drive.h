#pragma once

#include <XBDM.h>

#include "Elements/Element.h"

class Drive : public Element
{
public:
    Drive(const XBDM::Drive &data);

    virtual void OnClick() override;

private:
    XBDM::Drive m_Data;
    bool m_ShowPropertiesWindow = false;

    void DisplayProperties();

    virtual void DisplayContextMenu() override;
};
